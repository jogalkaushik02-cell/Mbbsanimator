"""
Internet Access Module - Medical web search and content fetching
Supports PubMed, Wikipedia, medical guidelines, drug databases
Indian medical references integrated (Park, Robbins, KDT, Guyton, etc.)
"""

import asyncio
import httpx
import time
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, field
from bs4 import BeautifulSoup
import re
import json
from urllib.parse import quote_plus

from backend.config import settings
from backend.fuzzy_search import correct_spelling, expand_query, get_search_suggestions
from backend.indian_references import (
    get_references_by_subject,
    get_references_by_keyword,
    get_top_references,
    INDIAN_MEDICAL_REFERENCES,
)


@dataclass
class SearchResult:
    title: str
    url: str
    snippet: str
    source: str


@dataclass
class MedicalArticle:
    title: str
    authors: List[str]
    journal: str
    year: int
    doi: str
    abstract: str
    url: str
    pmid: str = ""


@dataclass
class RetryConfig:
    max_retries: int = 3
    base_delay: float = 1.0
    max_delay: float = 10.0
    backoff_factor: float = 2.0


class RateLimiter:
    """Simple rate limiter for API calls"""

    def __init__(self, calls_per_second: float = 3.0):
        self.min_interval = 1.0 / calls_per_second
        self.last_call = 0.0
        self._lock = asyncio.Lock()

    async def acquire(self):
        async with self._lock:
            now = time.monotonic()
            elapsed = now - self.last_call
            if elapsed < self.min_interval:
                await asyncio.sleep(self.min_interval - elapsed)
            self.last_call = time.monotonic()


class MedicalWebSearch:
    """Unified medical web search across multiple sources"""

    USER_AGENT = "MedVidAI/1.0 (Medical Education Video Generator; contact@medvid.ai)"

    def __init__(self):
        self.client = httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers={"User-Agent": self.USER_AGENT},
            limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
        )
        self.serper_key = settings.SERPER_API_KEY
        self.retry_config = RetryConfig()
        self.pubmed_limiter = RateLimiter(calls_per_second=3.0 if not settings.PUBMED_API_KEY else 10.0)

    async def _retry_request(
        self,
        method: str,
        url: str,
        retry_config: Optional[RetryConfig] = None,
        **kwargs,
    ) -> Optional[httpx.Response]:
        """Execute HTTP request with retry logic and exponential backoff"""
        config = retry_config or self.retry_config
        last_error = None

        for attempt in range(config.max_retries):
            try:
                if method.upper() == "GET":
                    response = await self.client.get(url, **kwargs)
                elif method.upper() == "POST":
                    response = await self.client.post(url, **kwargs)
                else:
                    raise ValueError(f"Unsupported method: {method}")

                # Check for rate limiting (429) or server errors (5xx)
                if response.status_code == 429:
                    retry_after = float(response.headers.get("Retry-After", config.base_delay * (config.backoff_factor ** attempt)))
                    print(f"Rate limited. Waiting {retry_after:.1f}s before retry...")
                    await asyncio.sleep(retry_after)
                    continue

                if response.status_code >= 500:
                    delay = min(config.base_delay * (config.backoff_factor ** attempt), config.max_delay)
                    print(f"Server error {response.status_code}. Retrying in {delay:.1f}s...")
                    await asyncio.sleep(delay)
                    continue

                return response

            except (httpx.TimeoutException, httpx.ConnectError, httpx.ReadError) as e:
                last_error = e
                delay = min(config.base_delay * (config.backoff_factor ** attempt), config.max_delay)
                print(f"Request failed ({type(e).__name__}: {e}). Retrying in {delay:.1f}s...")
                await asyncio.sleep(delay)

        print(f"All {config.max_retries} retries failed for {url}: {last_error}")
        return None

    async def search_google(self, query: str, num_results: int = 10) -> List[SearchResult]:
        """Search via Serper API (Google Search)"""
        if not self.serper_key:
            return await self._search_duckduckgo(query, num_results)

        try:
            response = await self._retry_request(
                "POST",
                "https://google.serper.dev/search",
                headers={"X-API-KEY": self.serper_key, "Content-Type": "application/json"},
                json={"q": f"{query} medical", "num": num_results},
            )
            if not response:
                return await self._search_duckduckgo(query, num_results)

            data = response.json()
            results = []
            for item in data.get("organic", [])[:num_results]:
                results.append(SearchResult(
                    title=item.get("title", ""),
                    url=item.get("link", ""),
                    snippet=item.get("snippet", ""),
                    source="google",
                ))
            return results
        except Exception as e:
            print(f"Serper search failed: {e}")
            return await self._search_duckduckgo(query, num_results)

    async def _search_duckduckgo(self, query: str, num_results: int = 10) -> List[SearchResult]:
        """Fallback: DuckDuckGo HTML scraping"""
        try:
            url = f"https://html.duckduckgo.com/html/?q={quote_plus(query + ' medical')}"
            response = await self._retry_request("GET", url)
            if not response:
                return []

            soup = BeautifulSoup(response.text, "html.parser")
            results = []
            for result in soup.select(".result__body")[:num_results]:
                title_elem = result.select_one(".result__title a")
                snippet_elem = result.select_one(".result__snippet")
                if title_elem:
                    results.append(SearchResult(
                        title=title_elem.get_text(strip=True),
                        url=title_elem.get("href", ""),
                        snippet=snippet_elem.get_text(strip=True) if snippet_elem else "",
                        source="duckduckgo",
                    ))
            return results
        except Exception as e:
            print(f"DuckDuckGo search failed: {e}")
            return []

    async def search_pubmed(self, query: str, max_results: int = 20) -> List[MedicalArticle]:
        """Search PubMed via E-utilities with rate limiting and retries"""
        try:
            await self.pubmed_limiter.acquire()

            # Step 1: Search for PMIDs using esearch
            search_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
            params = {
                "db": "pubmed",
                "term": query,
                "retmax": max_results,
                "retmode": "json",
                "sort": "relevance",
            }
            if settings.PUBMED_API_KEY:
                params["api_key"] = settings.PUBMED_API_KEY

            response = await self._retry_request("GET", search_url, params=params)
            if not response:
                return []

            # Validate response is JSON, not HTML error page
            content_type = response.headers.get("content-type", "")
            if "json" not in content_type and not response.text.strip().startswith("{"):
                print(f"PubMed esearch returned non-JSON response (content-type: {content_type})")
                return []

            data = response.json()
            pmids = data.get("esearchresult", {}).get("idlist", [])

            if not pmids:
                return []

            # Step 2: Fetch article details using efetch (XML format for reliability)
            await self.pubmed_limiter.acquire()

            fetch_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
            params = {
                "db": "pubmed",
                "id": ",".join(pmids),
                "retmode": "xml",
            }
            if settings.PUBMED_API_KEY:
                params["api_key"] = settings.PUBMED_API_KEY

            response = await self._retry_request("GET", fetch_url, params=params)
            if not response:
                return []

            # Validate response is XML, not HTML error page
            content_type = response.headers.get("content-type", "")
            if "xml" not in content_type and "html" in content_type:
                print(f"PubMed efetch returned HTML instead of XML (content-type: {content_type})")
                # Try to parse anyway - sometimes content-type is wrong but body is valid XML

            soup = BeautifulSoup(response.text, "xml")

            # Check if we got valid XML with PubmedArticle elements
            articles_xml = soup.select("PubmedArticle")
            if not articles_xml:
                # Maybe the XML parsing failed - try with html.parser as fallback
                soup = BeautifulSoup(response.text, "html.parser")
                articles_xml = soup.select("PubmedArticle")

            articles = []
            for article in articles_xml:
                pmid = article.select_one("PMID")
                pmid_text = pmid.get_text() if pmid else ""

                title = article.select_one("ArticleTitle")
                title_text = title.get_text() if title else ""

                abstract_elem = article.select_one("AbstractText")
                abstract = abstract_elem.get_text() if abstract_elem else ""

                journal_elem = article.select_one("Journal Title")
                journal = journal_elem.get_text() if journal_elem else ""

                year_elem = article.select_one("PubDate Year")
                year = 0
                if year_elem and year_elem.get_text().isdigit():
                    year = int(year_elem.get_text())

                authors = []
                for author in article.select("Author"):
                    last = author.select_one("LastName")
                    first = author.select_one("ForeName")
                    if last:
                        last_text = last.get_text()
                        first_text = first.get_text() if first else ""
                        authors.append(f"{last_text} {first_text[0]}." if first_text else last_text)

                doi_elem = article.select_one("ArticleId[IdType=doi]")
                doi = doi_elem.get_text() if doi_elem else ""

                articles.append(MedicalArticle(
                    title=title_text,
                    authors=authors,
                    journal=journal,
                    year=year,
                    doi=doi,
                    abstract=abstract,
                    url=f"https://pubmed.ncbi.nlm.nih.gov/{pmid_text}/",
                    pmid=pmid_text,
                ))

            return articles

        except Exception as e:
            print(f"PubMed search failed: {e}")
            return []

    async def search_wikipedia(self, query: str) -> Optional[Dict[str, Any]]:
        """Search Wikipedia for medical topics"""
        try:
            search_url = "https://en.wikipedia.org/w/api.php"
            params = {
                "action": "query",
                "list": "search",
                "srsearch": query,
                "format": "json",
                "srlimit": 5,
            }
            response = await self._retry_request("GET", search_url, params=params)
            if not response:
                return None

            data = response.json()
            if not data.get("query", {}).get("search"):
                return None

            page_title = data["query"]["search"][0]["title"]

            params = {
                "action": "query",
                "prop": "extracts|links|categories|images",
                "exintro": True,
                "explaintext": True,
                "titles": page_title,
                "format": "json",
            }
            response = await self._retry_request("GET", search_url, params=params)
            if not response:
                return None

            data = response.json()
            pages = data.get("query", {}).get("pages", {})
            for page in pages.values():
                return {
                    "title": page.get("title", ""),
                    "extract": page.get("extract", ""),
                    "url": f"https://en.wikipedia.org/wiki/{quote_plus(page.get('title', ''))}",
                    "categories": [c["title"] for c in page.get("categories", [])],
                }

        except Exception as e:
            print(f"Wikipedia search failed: {e}")
        return None

    async def fetch_drug_info(self, drug_name: str) -> Dict[str, Any]:
        """Fetch drug info from multiple sources"""
        results = {}

        try:
            url = f"https://dailymed.nlm.nih.gov/dailymed/services/v2/drugnames.json?name={quote_plus(drug_name)}"
            response = await self._retry_request("GET", url)
            if response:
                data = response.json()
                if data.get("data"):
                    results["dailymed"] = data["data"][0]
        except Exception:
            pass

        try:
            url = f"https://api.fda.gov/drug/label.json?search=generic_name:{quote_plus(drug_name)}&limit=1"
            response = await self._retry_request("GET", url)
            if response:
                data = response.json()
                if data.get("results"):
                    results["openfda"] = data["results"][0]
        except Exception:
            pass

        return results

    async def fetch_guidelines(self, condition: str) -> List[Dict[str, Any]]:
        """Fetch clinical guidelines"""
        guidelines = []
        results = await self.search_google(
            f"{condition} clinical guideline site:guideline.gov OR site:nice.org.uk OR site:escardio.org OR site:acc.org OR site:aha.org"
        )

        for result in results[:5]:
            try:
                resp = await self._retry_request("GET", result.url)
                if resp:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    text = soup.get_text()[:5000]
                    guidelines.append({
                        "title": result.title,
                        "url": result.url,
                        "content": text,
                        "source": result.source,
                    })
            except Exception:
                pass

        return guidelines

    async def search_all(self, query: str) -> Dict[str, Any]:
        """Search across all sources concurrently with individual error handling"""
        tasks = {
            "web": self.search_google(query),
            "pubmed": self.search_pubmed(query),
            "wikipedia": self.search_wikipedia(query),
        }

        results = {}
        for key, task in tasks.items():
            try:
                results[key] = await task
            except Exception as e:
                print(f"Search {key} failed: {e}")
                results[key] = [] if key != "wikipedia" else None

        return results

    async def close(self):
        await self.client.aclose()


def get_indian_references(query: str) -> List[Dict[str, Any]]:
    """Get Indian medical textbook references relevant to the query"""
    refs = []
    query_lower = query.lower()

    # Search by keyword
    keyword_refs = get_references_by_keyword(query_lower)

    # Also search expanded terms
    expanded = expand_query(query)
    for term in expanded:
        keyword_refs.extend(get_references_by_keyword(term))

    # Deduplicate
    seen = set()
    for ref in keyword_refs:
        if ref.title not in seen:
            seen.add(ref.title)
            refs.append({
                "title": ref.title,
                "authors": ref.authors,
                "publisher": ref.publisher,
                "edition": ref.edition,
                "subject": ref.subject,
                "indian_relevance": ref.indian_relevance,
            })

    return refs[:5]  # Top 5 relevant references


async def search_medical(query: str, sources: List[str] = None) -> Dict[str, Any]:
    """High-level search with spelling correction and Indian references"""
    if sources is None:
        sources = ["google", "pubmed", "wikipedia"]

    # Step 1: Correct spelling mistakes
    corrected_query = correct_spelling(query)
    if corrected_query != query.lower():
        print(f"Spelling corrected: '{query}' -> '{corrected_query}'")

    # Step 2: Search with corrected query
    searcher = MedicalWebSearch()
    results = {}

    # Use corrected query for actual searches
    search_query = corrected_query

    if "google" in sources:
        results["web"] = await searcher.search_google(search_query)

    if "pubmed" in sources:
        results["pubmed"] = await searcher.search_pubmed(search_query)

    if "wikipedia" in sources:
        results["wikipedia"] = await searcher.search_wikipedia(search_query)

    await searcher.close()

    # Step 3: Add Indian medical references
    results["indian_references"] = get_indian_references(query)
    results["corrected_query"] = corrected_query
    results["original_query"] = query

    return results


if __name__ == "__main__":
    async def test():
        # Test with misspelling
        results = await search_medical("phagocytosys mechanism")
        print(f"Corrected: {results.get('corrected_query')}")
        print(f"PubMed: {len(results.get('pubmed', []))} articles")
        print(f"Indian refs: {len(results.get('indian_references', []))}")
        for ref in results.get("indian_references", []):
            print(f"  - {ref['title']} ({ref['edition']})")

    asyncio.run(test())

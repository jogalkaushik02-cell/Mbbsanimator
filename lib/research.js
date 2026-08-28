const fetch = require("node-fetch");
const cheerio = require("cheerio");

const FETCH_TIMEOUT = 10000;
const HEADERS = { "User-Agent": "MBBSMedAnimate/1.0 (Medical Education App)" };

async function safeFetch(url, opts = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeout || FETCH_TIMEOUT);
  try {
    const res = await fetch(url, {
      ...opts,
      signal: controller.signal,
      headers: { ...HEADERS, ...opts.headers }
    });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

async function searchPubMed(query, maxResults = 5) {
  try {
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=${maxResults}&term=${encodeURIComponent(query)}`;
    const searchRes = await safeFetch(searchUrl);
    const searchData = await searchRes.json();
    const ids = searchData?.esearchresult?.idlist || [];
    if (ids.length === 0) return [];

    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}`;
    const summaryRes = await safeFetch(summaryUrl);
    const summaryData = await summaryRes.json();

    const articles = [];
    for (const id of ids) {
      const article = summaryData?.result?.[id];
      if (article) {
        articles.push({
          source: "PubMed",
          id,
          title: article.title || "",
          authors: article.authors?.map(a => a.name).join(", ") || "",
          journal: article.fulljournalname || article.source || "",
          year: article.pubdate?.split(" ")[0] || "",
          pmid: id,
          url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
        });
      }
    }
    return articles;
  } catch (e) {
    console.error("PubMed error:", e.message);
    return [];
  }
}

async function searchOpenAlex(query, maxResults = 5) {
  try {
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=${maxResults}&mailto=research@mbbs.app`;
    const res = await safeFetch(url);
    const data = await res.json();
    return (data?.results || []).map(w => ({
      source: "OpenAlex",
      id: w.id,
      title: w.title || "",
      authors: w.authorships?.map(a => a.author?.display_name).filter(Boolean).join(", ") || "",
      journal: w.primary_location?.source?.display_name || "",
      year: w.publication_year?.toString() || "",
      doi: w.doi || "",
      url: w.doi ? `https://doi.org/${w.doi}` : w.id,
      citedBy: w.cited_by_count || 0
    }));
  } catch (e) {
    console.error("OpenAlex error:", e.message);
    return [];
  }
}

async function searchWikipedia(query) {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    const res = await safeFetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      source: "Wikipedia",
      title: data.title || "",
      summary: data.extract || "",
      url: data.content_urls?.desktop?.page || "",
      thumbnail: data.thumbnail?.source || ""
    };
  } catch (e) {
    console.error("Wikipedia error:", e.message);
    return null;
  }
}

async function searchCrossRef(query, maxResults = 5) {
  try {
    const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=${maxResults}&mailto=research@mbbs.app`;
    const res = await safeFetch(url);
    const data = await res.json();
    return (data?.message?.items || []).map(item => ({
      source: "CrossRef",
      title: item.title?.[0] || "",
      authors: item.author?.map(a => `${a.given || ""} ${a.family || ""}`).join(", ") || "",
      journal: item["container-title"]?.[0] || "",
      year: item.published?.["date-parts"]?.[0]?.[0]?.toString() || "",
      doi: item.DOI || "",
      url: item.DOI ? `https://doi.org/${item.DOI}` : "",
      citedBy: item["is-referenced-by-count"] || 0
    }));
  } catch (e) {
    console.error("CrossRef error:", e.message);
    return [];
  }
}

async function searchSemanticScholar(query, maxResults = 5) {
  try {
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${maxResults}&fields=title,authors,journal,year,url,externalIds,citationCount`;
    const res = await safeFetch(url);
    const data = await res.json();
    return (data?.data || []).map(p => ({
      source: "Semantic Scholar",
      title: p.title || "",
      authors: p.authors?.map(a => a.name).join(", ") || "",
      journal: p.journal?.name || "",
      year: p.year?.toString() || "",
      url: p.url || "",
      citedBy: p.citationCount || 0
    }));
  } catch (e) {
    console.error("Semantic Scholar error:", e.message);
    return [];
  }
}

async function searchGoogleScholar(query) {
  try {
    const url = `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}&hl=en&num=5`;
    const res = await safeFetch(url, {
      timeout: 12000,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
    });
    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const results = [];
    $(".gs_r.gs_or.gs_scl").each((i, el) => {
      const title = $(el).find(".gs_rt a").text() || $(el).find(".gs_rt").text();
      const snippet = $(el).find(".gs_rs").text();
      const link = $(el).find(".gs_rt a").attr("href") || "";
      const info = $(el).find(".gs_a").text();
      if (title) {
        results.push({ source: "Google Scholar", title: title.trim(), snippet: snippet.trim(), info: info.trim(), url: link });
      }
    });
    return results;
  } catch (e) {
    console.error("Google Scholar error:", e.message);
    return [];
  }
}

async function searchDuckDuckGo(query) {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`;
    const res = await safeFetch(url);
    const data = await res.json();
    return {
      source: "DuckDuckGo",
      abstract: data.AbstractText || "",
      abstractSource: data.AbstractSource || "",
      abstractURL: data.AbstractURL || "",
      relatedTopics: (data.RelatedTopics || []).slice(0, 5).map(t => ({ text: t.Text || "", url: t.FirstURL || "" }))
    };
  } catch (e) {
    console.error("DuckDuckGo error:", e.message);
    return {};
  }
}

async function researchTopic(topic) {
  const [pubmed, openalex, crossref, semanticScholar, wikipedia, googleScholar, duckduckgo] = await Promise.all([
    searchPubMed(topic),
    searchOpenAlex(topic),
    searchCrossRef(topic),
    searchSemanticScholar(topic),
    searchWikipedia(topic),
    searchGoogleScholar(topic),
    searchDuckDuckGo(topic)
  ]);

  const totalSources = pubmed.length + openalex.length + crossref.length + semanticScholar.length + (wikipedia ? 1 : 0) + googleScholar.length;

  return {
    topic,
    timestamp: new Date().toISOString(),
    sourcesFound: totalSources,
    research: {
      pubmed: { count: pubmed.length, articles: pubmed },
      openalex: { count: openalex.length, articles: openalex },
      crossref: { count: crossref.length, articles: crossref },
      semanticScholar: { count: semanticScholar.length, articles: semanticScholar },
      wikipedia,
      googleScholar: { count: googleScholar.length, results: googleScholar },
      duckduckgo
    }
  };
}

module.exports = { researchTopic };

const fetch = require("node-fetch");
const cheerio = require("cheerio");

const FETCH_TIMEOUT = 12000;
const HEADERS = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" };

async function safeFetch(url, opts = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeout || FETCH_TIMEOUT);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal, headers: { ...HEADERS, ...opts.headers } });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

// Search DuckDuckGo HTML for actual search results
async function searchDuckDuckGoHTML(query) {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + " medical textbook")}`;
    const res = await safeFetch(url, { timeout: 15000 });
    const html = await res.text();
    const $ = cheerio.load(html);
    const results = [];
    $(".result").each((i, el) => {
      const title = $(el).find(".result__title a").text().trim() || $(el).find(".result__title").text().trim();
      const snippet = $(el).find(".result__snippet").text().trim();
      const link = $(el).find(".result__title a").attr("href") || "";
      if (title && snippet && snippet.length > 30) {
        results.push({ title, snippet, url: link });
      }
    });
    return results;
  } catch (e) {
    console.error("DuckDuckGo HTML error:", e.message);
    return [];
  }
}

// Search DuckDuckGo instant answer API
async function searchDuckDuckGoInstant(query) {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`;
    const res = await safeFetch(url);
    const data = await res.json();
    const results = [];
    if (data.AbstractText) {
      results.push({ title: data.Heading || query, snippet: data.AbstractText, url: data.AbstractURL || "" });
    }
    if (data.Answer) {
      results.push({ title: "Answer", snippet: data.Answer, url: "" });
    }
    (data.RelatedTopics || []).forEach(t => {
      if (t.Text && t.Text.length > 30) {
        results.push({ title: t.Text.substring(0, 80), snippet: t.Text, url: t.FirstURL || "" });
      }
    });
    return results;
  } catch (e) {
    console.error("DuckDuckGo Instant error:", e.message);
    return [];
  }
}

// Search Wikipedia for medical content
async function searchWikipedia(query) {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    const res = await safeFetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return { source: "Wikipedia", title: data.title || "", summary: data.extract || "", url: data.content_urls?.desktop?.page || "" };
  } catch (e) {
    console.error("Wikipedia error:", e.message);
    return null;
  }
}

// Search PubMed for medical articles
async function searchPubMed(query) {
  try {
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=5&term=${encodeURIComponent(query)}`;
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
          source: "PubMed", title: article.title || "",
          authors: article.authors?.map(a => a.name).join(", ") || "",
          journal: article.fulljournalname || article.source || "",
          year: article.pubdate?.split(" ")[0] || "",
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

// Search OpenAlex
async function searchOpenAlex(query) {
  try {
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=5&mailto=research@mbbs.app`;
    const res = await safeFetch(url);
    const data = await res.json();
    return (data?.results || []).map(w => ({
      source: "OpenAlex", title: w.title || "",
      authors: w.authorships?.map(a => a.author?.display_name).filter(Boolean).join(", ") || "",
      journal: w.primary_location?.source?.display_name || "",
      year: w.publication_year?.toString() || "",
      url: w.doi ? `https://doi.org/${w.doi}` : w.id
    }));
  } catch (e) {
    console.error("OpenAlex error:", e.message);
    return [];
  }
}

async function researchTopic(topic) {
  // Run all searches in parallel
  const [wiki, pubmed, openalex, ddgHTML, ddgInstant] = await Promise.all([
    searchWikipedia(topic),
    searchPubMed(topic),
    searchOpenAlex(topic),
    searchDuckDuckGoHTML(topic),
    searchDuckDuckGoInstant(topic)
  ]);

  // Combine all results
  const allResults = [];

  // Wikipedia first (best for overview)
  if (wiki && wiki.summary) {
    allResults.push({ source: "Wikipedia", title: wiki.title, snippet: wiki.summary, url: wiki.url });
  }

  // DuckDuckGo HTML results (textbook content)
  ddgHTML.forEach(r => allResults.push({ source: "Textbook", ...r }));

  // DuckDuckGo instant answers
  ddgInstant.forEach(r => allResults.push({ source: "Medical Reference", ...r }));

  // PubMed articles
  pubmed.forEach(a => allResults.push({ source: "PubMed", title: a.title, snippet: a.authors + " (" + a.year + ") " + a.journal, url: a.url }));

  // OpenAlex articles
  openalex.forEach(a => allResults.push({ source: "OpenAlex", title: a.title, snippet: a.authors + " (" + a.year + ") " + a.journal, url: a.url }));

  const totalSources = allResults.length;

  return {
    topic,
    timestamp: new Date().toISOString(),
    sourcesFound: totalSources,
    research: {
      pubmed: { count: pubmed.length, articles: pubmed },
      openalex: { count: openalex.length, articles: openalex },
      crossref: { count: 0, articles: [] },
      semanticScholar: { count: 0, articles: [] },
      wikipedia: wiki,
      googleScholar: { count: 0, results: [] },
      duckduckgo: { abstract: ddgInstant.map(r => r.snippet).join(". "), relatedTopics: ddgHTML.map(r => ({ text: r.snippet, url: r.url })) },
      allResults
    }
  };
}

module.exports = { researchTopic };

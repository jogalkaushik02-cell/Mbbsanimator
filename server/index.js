const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const path = require("path");
const Synthesizer = require("./synthesizer");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

// ============================================
// FREE Medical Research APIs (No API Keys)
// ============================================

// 1. PubMed - NCBI (free, no key for basic use)
async function searchPubMed(query, maxResults = 5) {
  try {
    // Step 1: Search for IDs
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=${maxResults}&term=${encodeURIComponent(query)}`;
    const searchRes = await fetch(searchUrl, { timeout: 8000 });
    const searchData = await searchRes.json();
    const ids = searchData?.esearchresult?.idlist || [];
    if (ids.length === 0) return [];

    // Step 2: Fetch summaries
    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}`;
    const summaryRes = await fetch(summaryUrl, { timeout: 8000 });
    const summaryData = await summaryRes.json();

    const articles = [];
    for (const id of ids) {
      const article = summaryData?.result?.[id];
      if (article) {
        articles.push({
          source: "PubMed",
          id: id,
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

// 2. OpenAlex - Free academic database (no key needed)
async function searchOpenAlex(query, maxResults = 5) {
  try {
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=${maxResults}&mailto=research@mbbs.app`;
    const res = await fetch(url, { timeout: 8000 });
    const data = await res.json();
    const works = data?.results || [];

    return works.map(w => ({
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

// 3. Wikipedia - Free encyclopedia (no key needed)
async function searchWikipedia(query) {
  try {
    // Search for page
    const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    const res = await fetch(searchUrl, {
      timeout: 8000,
      headers: { "User-Agent": "MBBSMedAnimate/1.0 (Medical Education App)" }
    });
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

// 4. CrossRef - Free citation database (no key needed)
async function searchCrossRef(query, maxResults = 5) {
  try {
    const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=${maxResults}&mailto=research@mbbs.app`;
    const res = await fetch(url, { timeout: 8000 });
    const data = await res.json();
    const items = data?.message?.items || [];

    return items.map(item => ({
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

// 5. Semantic Scholar - AI-powered academic search (free tier)
async function searchSemanticScholar(query, maxResults = 5) {
  try {
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${maxResults}&fields=title,authors,journal,year,url,externalIds,citationCount`;
    const res = await fetch(url, { timeout: 8000 });
    const data = await res.json();
    const papers = data?.data || [];

    return papers.map(p => ({
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

// 6. Google Scholar via scraping (basic)
async function searchGoogleScholar(query) {
  try {
    const url = `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}&hl=en&num=5`;
    const res = await fetch(url, {
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    const results = [];
    $(".gs_r.gs_or.gs_scl").each((i, el) => {
      const title = $(el).find(".gs_rt a").text() || $(el).find(".gs_rt").text();
      const snippet = $(el).find(".gs_rs").text();
      const link = $(el).find(".gs_rt a").attr("href") || "";
      const info = $(el).find(".gs_a").text();

      if (title) {
        results.push({
          source: "Google Scholar",
          title: title.trim(),
          snippet: snippet.trim(),
          info: info.trim(),
          url: link
        });
      }
    });
    return results;
  } catch (e) {
    console.error("Google Scholar error:", e.message);
    return [];
  }
}

// 7. Search via free DuckDuckGo instant answers
async function searchDuckDuckGo(query) {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`;
    const res = await fetch(url, { timeout: 8000 });
    const data = await res.json();

    return {
      source: "DuckDuckGo",
      abstract: data.AbstractText || "",
      abstractSource: data.AbstractSource || "",
      abstractURL: data.AbstractURL || "",
      relatedTopics: (data.RelatedTopics || []).slice(0, 5).map(t => ({
        text: t.Text || "",
        url: t.FirstURL || ""
      }))
    };
  } catch (e) {
    console.error("DuckDuckGo error:", e.message);
    return {};
  }
}

// ============================================
// MASTER RESEARCH FUNCTION
// Searches ALL sources in parallel
// ============================================

async function researchTopic(topic) {
  console.log(`\n🔍 Researching: "${topic}"`);

  // Run ALL searches in parallel
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

  console.log(`✅ Found ${totalSources} sources across 7 databases`);

  return {
    topic,
    timestamp: new Date().toISOString(),
    sourcesFound: totalSources,
    research: {
      pubmed: { count: pubmed.length, articles: pubmed },
      openalex: { count: openalex.length, articles: openalex },
      crossref: { count: crossref.length, articles: crossref },
      semanticScholar: { count: semanticScholar.length, articles: semanticScholar },
      wikipedia: wikipedia,
      googleScholar: { count: googleScholar.length, results: googleScholar },
      duckduckgo: duckduckgo
    }
  };
}

// ============================================
// API ROUTES
// ============================================

// Main research endpoint
app.post("/api/research", async (req, res) => {
  const { topic } = req.body;
  if (!topic) {
    return res.status(400).json({ error: "Topic is required" });
  }

  try {
    const research = await researchTopic(topic);
    res.json(research);
  } catch (err) {
    console.error("Research error:", err);
    res.status(500).json({ error: "Research failed: " + err.message });
  }
});

// Synthesize research into narration + quiz
app.post("/api/synthesize", async (req, res) => {
  const { topic, research } = req.body;
  if (!topic || !research) {
    return res.status(400).json({ error: "Topic and research data required" });
  }

  try {
    const synthesized = Synthesizer.synthesize(topic, research);
    res.json(synthesized);
  } catch (err) {
    console.error("Synthesis error:", err);
    res.status(500).json({ error: "Synthesis failed: " + err.message });
  }
});

// Combined research + synthesize
app.post("/api/full-research", async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: "Topic required" });

  try {
    const research = await researchTopic(topic);
    const synthesized = Synthesizer.synthesize(topic, research);
    res.json({ research, synthesized });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🧬 MBBS Medical Animation Server`);
  console.log(`   Running on http://localhost:${PORT}`);
  console.log(`   Research APIs: PubMed, OpenAlex, CrossRef, SemanticScholar, Wikipedia, GoogleScholar\n`);
});

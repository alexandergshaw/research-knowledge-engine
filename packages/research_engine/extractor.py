"""HTML text extraction helpers."""

from __future__ import annotations

from bs4 import BeautifulSoup
import trafilatura


def extract_text(html: str, url: str | None = None) -> str:
    """Extract readable text from HTML, with a BeautifulSoup fallback."""

    extracted = trafilatura.extract(
        html,
        url=url,
        include_comments=False,
        include_links=False,
    )
    if extracted and extracted.strip():
        return extracted.strip()

    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()

    container = soup.find("article") or soup.find("main") or soup.body or soup
    lines = [line.strip() for line in container.get_text("\n").splitlines()]
    return "\n".join(line for line in lines if line)


def extract_title(html: str) -> str:
    """Extract a page title from HTML."""

    soup = BeautifulSoup(html, "html.parser")
    if soup.title and soup.title.text.strip():
        return soup.title.text.strip()
    heading = soup.find(["h1", "h2"])
    if heading and heading.get_text(strip=True):
        return heading.get_text(strip=True)
    return "Untitled"

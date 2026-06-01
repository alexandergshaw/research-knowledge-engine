# data

Static data files used by the research engine.

## Directory Layout

| Path | Purpose |
|---|---|
| `feeds/rss_feeds.yaml` | Configured RSS feed definitions |
| `feeds/search_queries.yaml` | Saved search queries |
| `trusted_sites/trusted_sites.yaml` | Trusted domain list for URL importing |
| `sample_data/` | Sample source data for development and testing |

## Configuration

### RSS Feeds (`feeds/rss_feeds.yaml`)

```yaml
feeds:
  - name: NIST Cybersecurity
    url: https://www.nist.gov/news-events/cybersecurity/rss.xml
    category: cybersecurity
    tags: [nist, cybersecurity, standards]
```

### Trusted Sites (`trusted_sites/trusted_sites.yaml`)

```yaml
trusted_sites:
  - domain: nist.gov
    category: cybersecurity
    trust_level: high
```

URL imports from domains not in this list are rejected unless `--force` is passed.

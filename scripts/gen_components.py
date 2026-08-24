"""Phase 1: split mirror/index.html into Astro components.

Conservative pretty-print: whitespace-only text between tags becomes
newline+indent (rendering-equivalent under CSS whitespace collapsing);
non-whitespace text is kept byte-exact. Braces are entity-escaped for Astro.
"""
import re, os, sys

ROOT = '/Users/boyang/Documents/GitHub/oryzo-rebuild'
SRC = open(f'{ROOT}/mirror/index.html').read()
OUT = f'{ROOT}/src/src/components'

VOID = {'img','br','input','meta','link','area','base','col','embed','hr','source','track','wbr'}

TAG_RE = re.compile(r'<(/?)([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"\']|"[^"]*"|\'[^\']*\')*?)(/?)>')

def extract(html, start):
    """Return balanced element substring starting at start (must be '<')."""
    depth = 0
    for m in TAG_RE.finditer(html, start):
        closing, tag, attrs, selfclose = m.groups()
        tag = tag.lower()
        if closing:
            depth -= 1
            if depth == 0:
                return html[start:m.end()]
        elif selfclose or tag in VOID:
            if depth == 0:  # single void element
                return html[start:m.end()]
        else:
            depth += 1
    raise ValueError('unbalanced from %d' % start)

def find_elem(html, pattern):
    m = re.search(pattern, html)
    if not m:
        raise ValueError(pattern)
    return extract(html, m.start())

def esc(text):
    return text.replace('{', '&#123;').replace('}', '&#125;')

def pretty(chunk, base_indent=0):
    out = []
    pos = 0
    depth = base_indent
    for m in TAG_RE.finditer(chunk):
        gap = chunk[pos:m.start()]
        closing, tag, attrs, selfclose = m.groups()
        ltag = tag.lower()
        if closing:
            depth -= 1
        if gap == '':
            out.append(m.group())          # tight junction: keep byte-exact
        elif gap.strip() == '':
            out.append('\n' + '  ' * depth + m.group())  # whitespace gap -> newline+indent
        else:
            out.append(esc(gap))           # real text: keep exact, tag stays tight
            out.append(m.group())
        if not closing and not selfclose and ltag not in VOID:
            depth += 1
        pos = m.end()
    tail = chunk[pos:]
    if tail.strip():
        out.append(esc(tail))
    return ''.join(out).strip('\n')

def fix_inline(s):
    """Re-join opening tag + text that pretty() split when text is followed by close tag on same run."""
    # <tag>\n?  handled fine; join '>\n  text</' cases are already inline. No-op placeholder.
    return s

body = SRC[SRC.index('<body'):]

pieces = {}
pieces['SvgDefs'] = find_elem(body, r'<svg style="display: none;">')
for sec in ['hero','ai','wearable','features','encryption','grip','sustainability','testimonies','social-content','product','open-weight','footer']:
    name = ''.join(w.capitalize() for w in sec.split('-'))
    pieces['sections/' + name] = find_elem(body, r'<div id="%s" class="section"' % re.escape(sec))
pieces['SiteHeader'] = find_elem(body, r'<header id="site-header"')
pieces['SiteFooter'] = find_elem(body, r'<footer id="site-footer"')
pieces['ScrollIndicator'] = find_elem(body, r'<div id="scroll-indicator"')
pieces['Preloader'] = find_elem(body, r'<div id="preloader"')
pieces['VideoOverlay'] = find_elem(body, r'<div id="video-overlay"')

os.makedirs(f'{OUT}/sections', exist_ok=True)
for name, chunk in pieces.items():
    p = pretty(chunk)
    with open(f'{OUT}/{name}.astro', 'w') as f:
        f.write(p + '\n')
    print(f'{name}.astro: {len(p)} bytes')

# sanity: total coverage
total = sum(len(c) for c in pieces.values())
print('covered', total, 'of body', len(body))

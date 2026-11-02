"""Generate a dotted SVG from Natural Earth's public-domain 1:110m land data."""
import json
from pathlib import Path
from collections import defaultdict

root=Path(__file__).resolve().parents[1]
data=json.loads((root/'scripts/assets/ne_110m_land.geojson').read_text(encoding='utf-8'))
polygons=[]
for feature in data['features']:
    geometry=feature['geometry']
    for rings in ([geometry['coordinates']] if geometry['type']=='Polygon' else geometry['coordinates']):
        points=rings[0]
        polygons.append((min(p[0] for p in points),min(p[1] for p in points),max(p[0] for p in points),max(p[1] for p in points),rings))

def inside(x,y,ring):
    hit=False
    a=ring[-1]
    for b in ring:
        if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:
            hit=not hit
        a=b
    return hit

def land(x,y):
    for xmin,ymin,xmax,ymax,rings in polygons:
        if xmin<=x<=xmax and ymin<=y<=ymax and inside(x,y,rings[0]) and not any(inside(x,y,r) for r in rings[1:]):
            return True
    return False

def project(lon,lat):
    return 40+(lon+180)*1120/360,40+(85-lat)*480/145

bands=defaultdict(list)
for row in range(56):
    lat=84-row*2.6
    for col in range(134):
        lon=-179+col*2.7+(1.35 if row%2 else 0)
        if lon<=180 and lat>=-60 and land(lon,lat):
            x,y=project(lon,lat)
            bands[int(x/72)].append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="2.15"/>')
x,y=project(78,22)
svg=['<svg xmlns="http://www.w3.org/2000/svg" class="world-map-art" viewBox="0 0 1200 590" role="img" aria-labelledby="world-map-title world-map-desc">',
 '<title id="world-map-title">Based in India. Working worldwide.</title>',
 '<desc id="world-map-desc">A world map formed from small dots, with India highlighted as the studio’s home base.</desc>',
 '<metadata>Land geometry: Natural Earth 1:110m physical land. Public domain. https://www.naturalearthdata.com/</metadata>',
 '<g class="world-map-grid"><path d="M40 40H1160M40 550H1160M40 30v20M600 30v20M1160 30v20M40 540v20M600 540v20M1160 540v20"/></g>']
for band,dots in sorted(bands.items()):
    svg.append(f'<g class="world-land-band" style="--band:{band}">'+''.join(dots)+'</g>')
svg.append(f'<g class="world-origin" aria-label="India, our home base"><circle class="world-origin-ring" cx="{x:.1f}" cy="{y:.1f}" r="12"/><circle class="world-origin-halo" cx="{x:.1f}" cy="{y:.1f}" r="9"/><circle class="world-origin-dot" cx="{x:.1f}" cy="{y:.1f}" r="4.5"/><path class="world-origin-leader" d="M{x+9:.1f} {y-9:.1f}l18-23h87"/><text class="world-origin-label" x="{x+34:.1f}" y="{y-40:.1f}">INDIA</text><text class="world-origin-subtitle" x="{x+34:.1f}" y="{y-20:.1f}">OUR HOME BASE</text></g>')
svg.append('<g class="world-map-coordinates"><text x="40" y="580">180° W</text><text x="600" y="580" text-anchor="middle">0°</text><text x="1160" y="580" text-anchor="end">180° E</text></g></svg>')
target=root/'dist/media/world-map.svg'
target.write_text(''.join(svg),encoding='utf-8')
print(json.dumps({'dots':sum(map(len,bands.values())),'svg_bytes':target.stat().st_size}))

import json

# tabler: brain, diamond
tabler = json.load(open('node_modules/@iconify-vue/tabler/iconify.json', encoding='utf-8'))
print("tabler keys:", list(tabler.keys()))
print("tabler width:", tabler.get('width'), "height:", tabler.get('height'))
# Find brain icon
for k in tabler.keys():
    v = tabler[k]
    if isinstance(v, dict) and 'brain' in v:
        print("brain body:", v['brain'].get('body', 'no body'))
    if isinstance(v, dict) and 'diamond' in v:
        print("diamond body:", v['diamond'].get('body', 'no body'))


# solar: fire-bold-duotone
solar = json.load(open('node_modules/@iconify-vue/solar/iconify.json', encoding='utf-8'))
for name in ['fire-bold-duotone']:
    icon = solar['icons'].get(name, {})
    vb = f"0 0 {icon.get('width', solar.get('width', 24))} {icon.get('height', solar.get('height', 24))}"
    print(f"\n=== solar/{name} (viewBox={vb}) ===")
    print(icon.get('body', 'NOT FOUND'))

# typcn: flash-outline
typcn = json.load(open('node_modules/@iconify-vue/typcn/iconify.json', encoding='utf-8'))
for name in ['flash-outline']:
    icon = typcn['icons'].get(name, {})
    vb = f"0 0 {icon.get('width', typcn.get('width', 24))} {icon.get('height', typcn.get('height', 24))}"
    print(f"\n=== typcn/{name} (viewBox={vb}) ===")
    print(icon.get('body', 'NOT FOUND'))

# line-md: star-twotone
linemd = json.load(open('node_modules/@iconify-vue/line-md/iconify.json', encoding='utf-8'))
for name in ['star-twotone']:
    icon = linemd['icons'].get(name, {})
    vb = f"0 0 {icon.get('width', linemd.get('width', 24))} {icon.get('height', linemd.get('height', 24))}"
    print(f"\n=== line-md/{name} (viewBox={vb}) ===")
    print(icon.get('body', 'NOT FOUND'))

# ri: target-fill
ri = json.load(open('node_modules/@iconify-vue/ri/iconify.json', encoding='utf-8'))
for name in ['target-fill']:
    icon = ri['icons'].get(name, {})
    vb = f"0 0 {icon.get('width', ri.get('width', 24))} {icon.get('height', ri.get('height', 24))}"
    print(f"\n=== ri/{name} (viewBox={vb}) ===")
    print(icon.get('body', 'NOT FOUND'))

# hugeicons: crown
hugeicons = json.load(open('node_modules/@iconify-vue/hugeicons/iconify.json', encoding='utf-8'))
for name in ['crown']:
    icon = hugeicons['icons'].get(name, {})
    vb = f"0 0 {icon.get('width', hugeicons.get('width', 24))} {icon.get('height', hugeicons.get('height', 24))}"
    print(f"\n=== hugeicons/{name} (viewBox={vb}) ===")
    print(icon.get('body', 'NOT FOUND'))

# mingcute: medal-line
mingcute = json.load(open('node_modules/@iconify-vue/mingcute/iconify.json', encoding='utf-8'))
for name in ['medal-line']:
    icon = mingcute['icons'].get(name, {})
    vb = f"0 0 {icon.get('width', mingcute.get('width', 24))} {icon.get('height', mingcute.get('height', 24))}"
    print(f"\n=== mingcute/{name} (viewBox={vb}) ===")
    print(icon.get('body', 'NOT FOUND'))

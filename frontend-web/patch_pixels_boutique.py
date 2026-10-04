path = "pages/boutique/[slug].js"
content = open(path).read()

content = content.replace(
    'import PromoBanner from "../../components/PromoBanner";',
    'import PromoBanner from "../../components/PromoBanner";\nimport { loadShopPixels } from "../../lib/adPixels";'
)

old = '''      .then((r) => {
        setShop(r.data);
        if (r.data.popup?.enabled) {'''
new = '''      .then((r) => {
        setShop(r.data);
        loadShopPixels(r.data.pixels);
        if (r.data.popup?.enabled) {'''

assert old in content, "marker boutique not found"
content = content.replace(old, new)
open(path, "w").write(content)
print("OK boutique")

path = "pages/produit/[id].js"
content = open(path).read()

content = content.replace(
    'import ShopPromoBanner from "../../components/ShopPromoBanner";',
    'import ShopPromoBanner from "../../components/ShopPromoBanner";\nimport { trackViewContent, trackAddToCart } from "../../lib/adPixels";'
)

old_view = '''  useEffect(() => {
    if (!id) return;
    api.get(`/products/${id}`).then((r) => {
      setProduct(r.data);'''
new_view = '''  useEffect(() => {
    if (!id) return;
    api.get(`/products/${id}`).then((r) => {
      setProduct(r.data);
      if (r.data.shop?.pixels) {
        trackViewContent(r.data.shop.pixels, { id: r.data._id, name: r.data.name, price: r.data.price });
      }'''

assert old_view in content, "marker view not found"
content = content.replace(old_view, new_view)

old_add = '''              addToCart({ ...product, name: displayName, price: unitPrice }, numericQty);'''
new_add = '''              addToCart({ ...product, name: displayName, price: unitPrice }, numericQty);
              if (product.shop?.pixels) {
                trackAddToCart(product.shop.pixels, { id: product._id, name: product.name, price: unitPrice, quantity: numericQty });
              }'''

assert old_add in content, "marker addtocart not found"
content = content.replace(old_add, new_add)

open(path, "w").write(content)
print("OK produit")

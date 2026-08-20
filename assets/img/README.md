# Images

## The rule

**Every image is an independent field in `js/products.js`.** Nothing is derived
from a product id, and no global switch sits between a product and its picture.
Change one image, and only that one changes.

## Current files

| File | Used by | Size |
|---|---|---|
| `roselle.webp` | Roselle **cover**, and the Women audience frame | 93 KB |
| `women.webp` | Home cover (`hero`) and `packaging` only | 59 KB |
| `unisex.webp` | NIELLOR Unisex / Aéris | 66 KB |
| `men.webp` | Valenor **cover**, and the Men audience frame | 53 KB |
| `valenor-box.webp` | Valenor gallery, 2nd — the presentation box | 79 KB |
| `lifestyle-band.webp` | Home lifestyle section | 41 KB |
| `valenor-person.webp` | *unused* — kept in case it is wanted back | 67 KB |

Valenor is the one fragrance with more than one photograph. The order the
customer sees is the cover first, then the `gallery` array in the order it is
written:

    men.webp  →  valenor-box.webp

`valenor-box.webp` is 922×1152 — its native size, so no detail was invented by
scaling up — and is exactly 4:5, the ratio every frame on the site is built
around. Files are named for what they show rather than by position, so
reordering the gallery never makes a filename wrong.

`valenor-person.webp` is on disk but referenced nowhere. Delete it whenever you
are sure it is not coming back.

## Renaming an image file

Renaming is safe, but a browser that already cached the old page can keep
asking for the old filename. The development server now sends
`Cache-Control: no-store`, so this cannot persist — if you ever swap that out
for a different server, keep a cache-busting policy in place.

`lifestyle-band.webp` is a 2100×900 banner composed from the existing Unisex
render: the full flacon placed right of centre on ivory, its edges feathered
into the background. It was built this way because cropping a 4:5 portrait into
a wide band cuts the bottle in half. Replace it with a dedicated wide campaign
shot whenever you have one — it is its own field (`NIELLOR_MEDIA.lifestyle`).

These are your original NIELLOR product renders, resized to 800×1000 and
converted to WebP (they were 1.7 MB PNGs — 5.1 MB for the three, too heavy for
a storefront on mobile data).

## Replacing one product's image

Open `js/products.js`, find that product, and edit its `image` block:

```js
{
  id: 'women',
  …
  image: {
    src: 'assets/img/women.webp',      // ← change this line only
    alt: 'NIELLOR Women eau de parfum'
  },
}
```

Nothing else is affected. You can use a different file format for one product
without touching the others — just write the full filename.

## Adding a new fragrance

Append an object to `NIELLOR_PRODUCTS` in `js/products.js`. Give it its own
`image`. Every page — home, collection, product, comparison table, filters,
cart — picks it up automatically. No layout work needed.

If you have no photograph yet, leave `src: ''` and a clean placeholder frame
appears instead. Never a broken image, never a stand-in from another product.

## Extra shots for one product

Add them to that product's `gallery` array. Thumbnails appear on the product
page only when a product has more than one image.

```js
gallery: [
  { src: 'assets/img/women-2.webp', alt: 'NIELLOR Women, packaging' }
]
```

## Editorial images

`NIELLOR_MEDIA` in the same file holds the non-product images:

- `hero` — the home page cover (currently the Women render)
- `packaging` — packaging section, **empty, showing a placeholder**
- `house` — reserved for a lifestyle image

Fill in `src` when you have the photography.

## Preparing files

- **4:5 portrait.** Cards, product images and the cover are all built around it.
- **About 1000 px** on the long edge.
- **WebP**, under ~100 KB each. [squoosh.app](https://squoosh.app) does this in
  the browser for free.

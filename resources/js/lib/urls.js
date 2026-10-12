// Same slugs as Str::slug on the server: /brands/makita, /categories/electrical-lighting.
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export const brandUrl = (routes, brand) => `${routes.home}/brands/${slug(brand)}`;
export const categoryUrl = (routes, category) => `${routes.home}/categories/${slug(category)}`;

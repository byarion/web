# Ondexi: cómo ponerla en marcha

Web bilingüe (español en `/`, inglés en `/en/`) que se actualiza sola cada 3 horas.

## Qué hay dentro
- `index.html` y `en/index.html`: las páginas.
- `style.css` y `app.js`: diseño y funcionamiento (noticias, mercados, calculadora).
- `update.py`: el "robot" que baja titulares y precios y los guarda en `data/`.
- `.github/workflows/update.yml`: le dice a GitHub que ejecute el robot cada 3 horas, gratis.

## Pasos para publicarla (gratis)
1. Crea una cuenta en GitHub y un repositorio nuevo llamado `ondexi`. Sube todo el contenido de esta carpeta.
2. En Cloudflare Pages (o Netlify) crea un proyecto conectado a ese repositorio. No necesita comando de build: la carpeta raíz es la web.
3. En la configuración del proyecto, añade tu dominio `ondexi.com`.
4. En tu dominio, cambia los DNS para que apunten a Cloudflare/Netlify en vez de Shopify (te lo indican ellos paso a paso). Hay que quitar el dominio de la tienda de Shopify.
5. En GitHub, pestaña Actions, ejecuta "Actualizar noticias y mercados" una vez a mano para llenar los datos.

## Antes de pedir AdSense
- Añade más guías propias (AdSense valora contenido original, no solo titulares).
- Crea páginas de Política de privacidad, Aviso legal y Contacto.
- Comprueba que los enlaces RSS de `update.py` funcionan; si una fuente falla, el robot la salta.

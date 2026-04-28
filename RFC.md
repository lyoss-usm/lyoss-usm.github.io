# RFC: Pagina web oficial de LyOSS

## 1. Contexto y Vision
* **Problema Actual:** La iniciativa LyOSS no tiene un punto central de informacion. Los nuevos miembros no saben como unirse, que proyectos existen o quienes forman parte de la coordinacion, dispersando el interes en Discord o Github sin guia clara.
* **Objetivo General:** Crear una plataforma web estatica que sirva como portal de bienvenida/informaciones, catalogo de proyectos y centro de recursos para la comunidad LyOSS.
* **Objetivos Especificos:**
    * Listar todos los repositorios activos de la organizacion de forma semi-automatizada.
    * Proporcionar una guia de "Formas de contribuir" para nuevos colaboradores
    * Mostrar al equipo de coordinacion e historia de la iniciativa
* **Metrica de Exito:** Aumento en el numero de contribuciones de nuevos miembros en 2026-1.
* **Imagen a Proyectar:** Espacio accesible e inclusivo, transparente y confiable, cercano al usuario, demuestra construccion colectiva.

## 2. Requisitos y Alcance (Definiendo el MVP)
* **Usuarios Finales**: Comunidad sansana cercana/interesada en linux y tecnologias open source, comunidades tecnologicas amigas.
* **Requisitos Funcionales:**
    * El sistema **debe** mostrar proyectos tanto activos como en construccion **para** atraer nuevos colaboradores
    * El sistema **debe** mostrar al equipo de coordinacion con imagenes **para** dar un rostro al equipo y entregar transparencia/confianza
    * El sistema **debe** contar la historia de la iniciativa mencionando los principales hitos que contribuyeron a su creacion **para** dar contexto de nuestra mision
    * El sistema **debe** proporcionar links a Discord, Whatsapp e Instagram **para** guiar a los visitantes facilmente a los canales principales
    * El sistema **debe** definir un codigo de conducta con valores, principios y alcance **para** que nuevos miembros esten alineados con nuestra vision.
    * El sistema **debe** proveer metricas de eventos sobre el flujo de llamada a la accion y trafico de la pagina web con SaaS de free tier **para** obtener analiticas sin mantener un backend. 

* **Lujo / Futuro (Despues del MVP):**
    * Incluir traducciones de multiples idiomas
    * Mostrar un tablon de anuncios/noticias de la comunidad
    * Mostrar un calendario de actividades
    * Incluir una seccion de blogs

* **Fuera de Alcance:**
    * La pagina no es una web corporativa
    * La pagina no es un reemplazo a sitios oficiales de la universidad
    * La pagina no es sobre noticias acerca de Open Soure o Linux.

## 3. Diseño Técnico y Arquitectura

* **Diagrama de Contexto:**

<img width="675" height="662" alt="Diagrama de Contexto" src="https://github.com/user-attachments/assets/bb7b27d9-fab2-4c4d-b5a4-ac3508dcf4f2" />

* **Tecnologias e Infraestructura:**
    * **Lenguajes/Librerias:** Astro, TailwindCSS, MDX
    * **Infraestructura:** Unico servidor web estatico hosteado Github Pages
    * **Licencia Sugerida:** MIT
* **Requisitos No Funcionales:**
    * Tipografia, colores y demas cosas tienen que proyectar ser amigables/cercanas, confiables/transparentes, etc. Se debe evitar el estilo "Fintech".
    * Respetar normas de accesibilidad web WCAG, ver referencia [aqui](https://www.w3.org/WAI/WCAG22/quickref/?versions=2.1).
    * El contenido debe estar automatizado con colecciones de Astro y MDX.
    * Imagenes y contenido multimedia debe estar optimizado para web. (formato webp, compresiones, etc.)

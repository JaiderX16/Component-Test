# Component Playground ⚡

Un entorno premium para probar componentes React de forma aislada.

## Cómo empezar

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Ejecutar el playground:**
   ```bash
   npm run dev
   ```

3. **Probar tus componentes:**
   Simplemente suelta tus archivos `.jsx` en la carpeta `src/playground-components/`. Deben tener una exportación por defecto (`export default`).

## Características

- **Detección Automática**: No necesitas importar nada manualmente.
- **Diseño Premium**: Interfaz oscura con efectos de desenfocado y cuadrículas de diseño.
- **Aislación de Errores**: Si un componente falla, el playground sigue funcionando.
- **Modos de Vista**: Prueba el diseño responsive (Mobile, Tablet, Desktop) con un clic.

## Estructura

- `src/playground-components/`: Coloca aquí lo que quieras probar.
- `src/App.jsx`: Lógica principal del entorno.
- `src/index.css`: Estilos globales y sistema de diseño.

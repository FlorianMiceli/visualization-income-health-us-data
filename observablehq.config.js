// See https://observablehq.com/framework/config for documentation.
export default {
  title: "US counties — economy & health",

  pages: [
    {
      name: "Dashboard",
      pages: [
        {
          name: "US counties — economy & cancer (Kaggle)",
          path: "/us-county-economy-health"
        }
      ]
    }
  ],

  head: '<link rel="icon" href="observable.png" type="image/png" sizes="32x32">',

  root: "src"
};

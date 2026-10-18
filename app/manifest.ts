import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SWU Sammlung Manager",
    short_name: "SWU Sammlung",
    description: "Verwaltung deiner Star Wars: Unlimited Kartensammlung",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: "https://cdn.swu-db.com/images/cards/SOR/010.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "https://cdn.swu-db.com/images/cards/SOR/010.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
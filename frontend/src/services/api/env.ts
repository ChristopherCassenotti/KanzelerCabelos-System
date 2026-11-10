const apiUrl = import.meta.env.VITE_API_URL?.trim();

if (!apiUrl) {
  console.warn(
    "VITE_API_URL não foi definida. Usando http://localhost:3333 em desenvolvimento.",
  );
}

export const env = {
  apiUrl: apiUrl || "http://localhost:3333",
} as const;

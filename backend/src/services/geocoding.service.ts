interface GeoapifyResult {
  lat: number;
  lon: number;
  formatted: string;
  place_id: string;
}

interface GeoapifyResponse {
  results: GeoapifyResult[];
}

export interface GeocodingResult {
  lat: number;
  lng: number;
  geoPlaceId: string;
  enderecoFormatado: string;
}

export class GeocodingService {
  async buscarEndereco(
    endereco: string,
  ): Promise<GeocodingResult | null> {
    const apiKey =
      process.env["GEOAPIFY_API_KEY"];

    if (!apiKey) {
      throw new Error(
        "GEOAPIFY_API_KEY não configurada",
      );
    }

    const url = new URL(
      "https://api.geoapify.com/v1/geocode/search",
    );

    url.searchParams.set(
      "text",
      endereco,
    );

    url.searchParams.set(
      "filter",
      "countrycode:br",
    );

    url.searchParams.set(
      "lang",
      "pt",
    );

    url.searchParams.set(
      "limit",
      "1",
    );

    url.searchParams.set(
      "format",
      "json",
    );

    url.searchParams.set(
      "apiKey",
      apiKey,
    );

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Erro ao consultar Geoapify: ${response.status}`,
      );
    }

    const data =
      (await response.json()) as GeoapifyResponse;

    const resultado =
      data.results[0];

    if (!resultado) {
      return null;
    }

    return {
      lat: resultado.lat,
      lng: resultado.lon,
      geoPlaceId:
        resultado.place_id,
      enderecoFormatado:
        resultado.formatted,
    };
  }
}
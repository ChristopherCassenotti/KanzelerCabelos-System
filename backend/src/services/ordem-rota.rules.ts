export interface CoordenadaRota {
  lat: number;
  lng: number;
}

export interface PontoOrdenavel
  extends CoordenadaRota {
  id: string;
}

function paraRadianos(
  graus: number,
) {
  return (
    graus *
    (Math.PI / 180)
  );
}

export function distanciaHaversineKm(
  origem: CoordenadaRota,
  destino: CoordenadaRota,
) {
  const raioTerraKm = 6371;

  const deltaLat =
    paraRadianos(
      destino.lat -
        origem.lat,
    );

  const deltaLng =
    paraRadianos(
      destino.lng -
        origem.lng,
    );

  const latOrigem =
    paraRadianos(
      origem.lat,
    );

  const latDestino =
    paraRadianos(
      destino.lat,
    );

  const a =
    Math.sin(
      deltaLat / 2,
    ) ** 2 +
    Math.cos(
      latOrigem,
    ) *
      Math.cos(
        latDestino,
      ) *
      Math.sin(
        deltaLng / 2,
      ) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a),
    );

  return raioTerraKm * c;
}

export function ordenarPorMenorDistancia(
  origem: CoordenadaRota,
  pontos: PontoOrdenavel[],
) {
  const restantes =
    [...pontos];

  const ordem: string[] = [];

  let pontoAtual =
    origem;

  while (
    restantes.length > 0
  ) {
    let indiceMaisProximo = 0;

    let menorDistancia =
      Number.POSITIVE_INFINITY;

    for (
      let indice = 0;
      indice <
      restantes.length;
      indice++
    ) {
      const ponto =
        restantes[indice];

      if (!ponto) {
        continue;
      }

      const distancia =
        distanciaHaversineKm(
          pontoAtual,
          ponto,
        );

      if (
        distancia <
        menorDistancia
      ) {
        menorDistancia =
          distancia;

        indiceMaisProximo =
          indice;
      }
    }

    const [proximo] =
      restantes.splice(
        indiceMaisProximo,
        1,
      );

    if (!proximo) {
      break;
    }

    ordem.push(
      proximo.id,
    );

    pontoAtual = {
      lat: proximo.lat,
      lng: proximo.lng,
    };
  }

  return ordem;
}
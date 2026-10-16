import type { CriarContatoInput, AtualizarContatoInput } from "../schemas/contato.schema";
import { ContatoRepository } from "../repositories/contato.repository";
import type { CriarContatoModel, AtualizarContatoModel } from "../models/contato.model";
import { FotoRepository } from "../repositories/foto.repository";
import { StorageService } from "./storage.service";
import { CompraRepository } from "../repositories/compra.repository";
import { RecompraService } from "./recompra.service";
import { CidadeRepository } from "../repositories/cidade.repository";
import { GeocodingService } from "./geocoding.service";
import { AuditoriaRepository } from "../repositories/auditoria.repository";

function normalizarBusca(
  valor: string | null | undefined,
) {
  return (valor ?? "")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLocaleLowerCase(
      "pt-BR",
    )
    .trim();
}

function somenteDigitos(
  valor: string | null | undefined,
) {
  return (valor ?? "").replace(
    /\D/g,
    "",
  );
}

export class ContatoService {
  constructor(
    private readonly contatoRepository = new ContatoRepository(),
    private readonly fotoRepository = new FotoRepository(),
    private readonly compraRepository = new CompraRepository(),
    private readonly storageService = new StorageService(),
    private readonly recompraService = new RecompraService(),
    private readonly cidadeRepository = new CidadeRepository(),
    private readonly geocodingService = new GeocodingService(),
    private readonly auditoriaRepository = new AuditoriaRepository(),
  ) {}

async create(data: CriarContatoInput) {
  let lat =
    data.lat !== undefined
      ? String(data.lat)
      : null;

  let lng =
    data.lng !== undefined
      ? String(data.lng)
      : null;

  let geoFonte =
    data.geoFonte ?? null;

  let geoPlaceId =
    data.geoPlaceId ?? null;

  const possuiCoordenadas =
    data.lat !== undefined &&
    data.lng !== undefined;

  if (
    !possuiCoordenadas &&
    data.endereco
  ) {
    const cidade =
      await this.cidadeRepository.findById(
        data.cidadeId,
      );

    if (cidade) {
      const enderecoCompleto =
        `${data.endereco}, ` +
        `${cidade.nome} - ${cidade.uf}, Brasil`;

      const geocoding =
        await this.geocodingService.buscarEndereco(
          enderecoCompleto,
        );

      if (geocoding) {
        lat = String(geocoding.lat);
        lng = String(geocoding.lng);

        geoFonte = "geoapify";

        geoPlaceId =
          geocoding.geoPlaceId;
      }
    }
  }
const hoje =
  Temporal.Now.plainDateISO(
    "America/Sao_Paulo",
  );
  const contato: CriarContatoModel = {
    nome: data.nome,
    cidadeId: data.cidadeId,

    telefone:
      data.telefone ?? null,

    endereco:
      data.endereco ?? null,

    lat,
    lng,
    geoFonte,
    geoPlaceId,

origem:
  data.origem ?? null,

indicadoPor:
  data.indicadoPor ?? null,

dataPrimeiroContato:
  data.dataPrimeiroContato !== undefined
    ? Temporal.PlainDate.from(
        data.dataPrimeiroContato,
      )
    : hoje,

dataAvaliacao:
  data.dataAvaliacao !== undefined
    ? Temporal.PlainDate.from(
        data.dataAvaliacao,
      )
    : null,
    natural:
      data.natural ?? null,
autorizouFoto:
  data.autorizouFoto ?? false,
    cor:
      data.cor ?? null,

    textura:
      data.textura ?? null,

    quimica:
      data.quimica ?? null,

    comprimentoCm:
      data.comprimentoCm ?? null,

    observacoes:
      data.observacoes ?? null,
  };

  return this.contatoRepository.create(
    contato,
  );
}

  async findAll() {
    return this.contatoRepository.findAll();
  }

  async findById(id: string) {
    const contato = await this.contatoRepository.findById(id);
  
    if (!contato) {
      return null;
    }
  
    const [fotos, compras, recompra] = await Promise.all([
      this.fotoRepository.findByContatoId(id),
      this.compraRepository.findByContatoId(id),
    
      contato.status === "comprado"
        ? this.recompraService.calcular(
            id,
            contato.cicloRecompraMeses,
          )
        : Promise.resolve(null),
    ]);
  
    const fotosComUrl = await Promise.all(
      fotos.map(async (foto) => ({
        ...foto,
        signedUrl: await this.storageService.createSignedUrl(
          foto.url,
          3600,
        ),
      })),
    );
    
  
    return {
      ...contato,
      fotos: fotosComUrl,
      compras,
      recompra,
    };
  }

async update(
  id: string,
  data: AtualizarContatoInput,
) {
  const atual =
    await this.contatoRepository.findById(id);

  if (!atual) {
    return null;
  }

  const contato: AtualizarContatoModel = {};
  
  if (data.nome !== undefined) {
    contato.nome = data.nome;
  }
if (
  data.autorizouFoto !== undefined
) {
  contato.autorizouFoto =
    data.autorizouFoto;
}
  if (data.telefone !== undefined) {
    contato.telefone = data.telefone;
  }

  if (data.cidadeId !== undefined) {
    contato.cidadeId = data.cidadeId;
  }

  if (data.endereco !== undefined) {
    contato.endereco = data.endereco;
  }

  if (data.origem !== undefined) {
    contato.origem = data.origem;
  }
if (
  data.indicadoPor !== undefined
) {
  contato.indicadoPor =
    data.indicadoPor;
}
  if (data.natural !== undefined) {
    contato.natural = data.natural;
  }

  if (data.cor !== undefined) {
    contato.cor = data.cor;
  }

  if (data.textura !== undefined) {
    contato.textura = data.textura;
  }

  if (data.quimica !== undefined) {
    contato.quimica = data.quimica;
  }

  if (data.comprimentoCm !== undefined) {
    contato.comprimentoCm =
      data.comprimentoCm;
  }

  if (data.observacoes !== undefined) {
    contato.observacoes =
      data.observacoes;
  }

  const enderecoOuCidadeMudou =
    data.endereco !== undefined ||
    data.cidadeId !== undefined;

  const coordenadaInformada =
    data.lat !== undefined ||
    data.lng !== undefined;

  if (coordenadaInformada) {
    if (data.lat !== undefined) {
      contato.lat = String(data.lat);
    }

    if (data.lng !== undefined) {
      contato.lng = String(data.lng);
    }

    contato.geoFonte =
      data.geoFonte ?? "manual";

    contato.geoPlaceId =
      data.geoPlaceId ?? null;
  } else if (enderecoOuCidadeMudou) {
    const enderecoFinal =
      data.endereco ?? atual.endereco;

    const cidadeIdFinal =
      data.cidadeId ?? atual.cidadeId;

    if (enderecoFinal) {
      const cidade =
        await this.cidadeRepository.findById(
          cidadeIdFinal,
        );

      if (cidade) {
        const enderecoCompleto =
          `${enderecoFinal}, ` +
          `${cidade.nome} - ${cidade.uf}, Brasil`;

        const geocoding =
          await this.geocodingService.buscarEndereco(
            enderecoCompleto,
          );

        if (geocoding) {
          contato.lat =
            String(geocoding.lat);

          contato.lng =
            String(geocoding.lng);

          contato.geoFonte =
            "geoapify";

          contato.geoPlaceId =
            geocoding.geoPlaceId;
        } else {
          contato.lat = null;
          contato.lng = null;
          contato.geoFonte = null;
          contato.geoPlaceId = null;
        }
      }
    }
  } else {
    if (data.geoFonte !== undefined) {
      contato.geoFonte =
        data.geoFonte;
    }

    if (
      data.geoPlaceId !== undefined
    ) {
      contato.geoPlaceId =
        data.geoPlaceId;
    }
  }
if (
  data.dataPrimeiroContato !== undefined
) {
  contato.dataPrimeiroContato =
    Temporal.PlainDate.from(
      data.dataPrimeiroContato,
    );
}

if (
  data.dataAvaliacao !== undefined
) {
  contato.dataAvaliacao =
    Temporal.PlainDate.from(
      data.dataAvaliacao,
    );
}
  return this.contatoRepository.update(
    id,
    contato,
  );
}

async delete(
  id: string,
  usuarioId: string | null = null,
) {
  const contato =
    await this.contatoRepository
      .softDelete(id);

  if (!contato) {
    return null;
  }

  await this.auditoriaRepository.create({
    usuarioId,
    acao: "contato_excluido",
    entidade: "contato",
    entidadeId: id,
    detalhes: JSON.stringify({
      nome: contato.nome,
    }),
  });

  return contato;
}

async deleteDefinitivo(
  id: string,
  usuarioId: string | null = null,
) {
  const contato =
    await this.contatoRepository
      .findByIdIncludingDeleted(id);

  if (!contato) {
    return null;
  }

  const fotos =
    await this.fotoRepository
      .findByContatoId(id);

  const paths =
    fotos.map(
      (foto) => foto.url,
    );

  await this.storageService
    .deleteImages(paths);

  const excluido =
    await this.contatoRepository
      .hardDelete(id);

  if (!excluido) {
    return null;
  }

  await this.auditoriaRepository.create({
    usuarioId,
    acao:
      "contato_excluido_definitivo",
    entidade: "contato",
    entidadeId: id,
    detalhes: JSON.stringify({
      nome: contato.nome,
    }),
  });

  return excluido;
}

async buscar(
  termo: string,
) {
  const busca =
    normalizarBusca(
      termo,
    );

  const buscaTelefone =
    somenteDigitos(
      termo,
    );

  const contatos =
    await this.contatoRepository
      .findAllComCidade();

  const encontrados =
    contatos.filter(
      (contato) => {
        const nome =
          normalizarBusca(
            contato.nome,
          );

        const cidade =
          normalizarBusca(
            contato.cidade.nome,
          );

        const endereco =
          normalizarBusca(
            contato.endereco,
          );

        const telefone =
          somenteDigitos(
            contato.telefone,
          );

        const encontrouTexto =
          nome.includes(busca) ||
          cidade.includes(busca) ||
          endereco.includes(busca);

        const encontrouTelefone =
          buscaTelefone.length > 0 &&
          telefone.includes(
            buscaTelefone,
          );

        return (
          encontrouTexto ||
          encontrouTelefone
        );
      },
    );

  encontrados.sort(
    (a, b) => {
      const nomeA =
        normalizarBusca(
          a.nome,
        );

      const nomeB =
        normalizarBusca(
          b.nome,
        );

      const prioridadeA =
        nomeA === busca
          ? 0
          : nomeA.startsWith(
                busca,
              )
            ? 1
            : nomeA.includes(
                  busca,
                )
              ? 2
              : 3;

      const prioridadeB =
        nomeB === busca
          ? 0
          : nomeB.startsWith(
                busca,
              )
            ? 1
            : nomeB.includes(
                  busca,
                )
              ? 2
              : 3;

      if (
        prioridadeA !==
        prioridadeB
      ) {
        return (
          prioridadeA -
          prioridadeB
        );
      }

      return a.nome.localeCompare(
        b.nome,
        "pt-BR",
      );
    },
  );

  return encontrados.slice(
    0,
    20,
  );
}

}


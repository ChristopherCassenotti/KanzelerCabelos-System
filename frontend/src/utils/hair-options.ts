export const colors = ["Preto", "Castanho escuro", "Castanho", "Castanho claro", "Loiro", "Ruivo", "Grisalho"];
export const textures = ["Liso", "Ondulado", "Cacheado", "Crespo"];
export const chemicals = ["Nenhuma", "Tintura", "Luzes/mechas", "Progressiva", "Alisamento"];

/** Mantém selecionável um valor antigo que não está na lista padrão. */
export function withCurrentOption(options: string[], current: string | null | undefined) {
  return current && !options.includes(current) ? [current, ...options] : options;
}

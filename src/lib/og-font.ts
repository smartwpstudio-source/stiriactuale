// Fontul se cere de la Google Fonts doar cu literele din text (câțiva KB, cu
// diacritice ș ț ă î â) — fontul implicit al generatorului nu le are pe toate.
export async function font(family: string, weight: number, text: string): Promise<ArrayBuffer> {
  const css = await (
    await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`)
  ).text();
  const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
  if (!url) throw new Error(`font ${family} indisponibil`);
  return (await fetch(url)).arrayBuffer();
}


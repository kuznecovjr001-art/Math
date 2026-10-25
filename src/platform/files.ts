import { isNative } from './native';

/** Сохраняет текстовый файл: в браузере — скачиванием, на Android — через «Поделиться» (Файлы, Диск, мессенджер). */
export async function saveTextFile(name: string, text: string): Promise<void> {
  if (isNative) {
    const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([
      import('@capacitor/filesystem'), import('@capacitor/share'),
    ]);
    // Файл с именами и прогрессом детей лежит в кэше только на время «Поделиться».
    const path = `share/${name}`;
    const { uri } = await Filesystem.writeFile({ path, data: text, directory: Directory.Cache, encoding: Encoding.UTF8, recursive: true });
    try {
      await Share.share({ title: name, files: [uri] });
    } finally {
      await Filesystem.deleteFile({ path, directory: Directory.Cache }).catch(() => undefined);
    }
    return;
  }
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

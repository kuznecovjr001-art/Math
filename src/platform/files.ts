import { isNative } from './native';

/** Сохраняет текстовый файл: в браузере — скачиванием, на Android — через «Поделиться» (Файлы, Диск, мессенджер). */
export async function saveTextFile(name: string, text: string): Promise<void> {
  if (isNative) {
    const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([
      import('@capacitor/filesystem'), import('@capacitor/share'),
    ]);
    // Файл с именами и прогрессом детей лежит в закрытом кэше недолго. Получатель (Диск, почта) читает его уже после
    // выбора в «Поделиться», поэтому сразу удалять нельзя: прошлую копию стираем здесь, эту — через 10 минут.
    await Filesystem.rmdir({ path: 'share', directory: Directory.Cache, recursive: true }).catch(() => undefined);
    const path = `share/${name}`;
    const { uri } = await Filesystem.writeFile({ path, data: text, directory: Directory.Cache, encoding: Encoding.UTF8, recursive: true });
    try {
      await Share.share({ title: name, files: [uri] });
    } finally {
      setTimeout(() => void Filesystem.deleteFile({ path, directory: Directory.Cache }).catch(() => undefined), 10 * 60_000);
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

# Simplified ⇄ Traditional

Convert selected Chinese text between Simplified (简体) and Traditional (繁體) in one click.

## Features

- **Two actions**: *To Traditional* and *To Simplified*. They only appear when the selection contains Chinese characters.
- **Live preview**: The converted text shows right in the popup bar. The preview only appears when the text would actually change.
- **Phrase-aware**: Context decides the right character, so `头发` → `頭髮`, `发展` → `發展`, `干净` → `乾淨`, `皇后` → `皇后` and `后面` → `後面`.
- **Regional variants** (choose in the extension's settings): *Standard* (default), *Taiwan* character forms, or *Taiwan + local phrases* (`软件` → `軟體`, `网络` → `網路`).
- Works offline; nothing leaves your Mac.

## Usage Examples

Select text and click the action. Click to copy the result to the clipboard; right-click to show it in a result card.

| Selection | Action / variant | Result |
| :--- | :--- | :--- |
| `软件和网络` | To Traditional, Standard | 軟件和網絡 |
| `软件和网络` | To Traditional, Taiwan + local phrases | 軟體和網路 |
| `里面的面条` | To Traditional, Standard | 裏面的麪條 |
| `頭髮與發展` | To Simplified | 头发与发展 |
| `資訊工程` | To Simplified, Taiwan + local phrases | 信息工程 |

## Configuration

- **Traditional variant**: Standard / Taiwan / Taiwan + local phrases. For To Simplified, it controls whether Taiwan wording is mapped back (`軟體` → `软件`).

## Credits

Conversion dictionaries come from [OpenCC](https://github.com/BYVoid/OpenCC) (Apache-2.0).

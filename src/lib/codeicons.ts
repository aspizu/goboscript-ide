import * as icons from "@icons-pack/react-simple-icons"
import type {FC} from "react"

const patterns = Object.fromEntries(
    `
asm:SiAssemblyscript
astro:SiAstro
bash:SiBash
bat:SiWindows
c:SiC
cc:SiCplusplus
cfg:SiIni
clj:SiClojure
cljs:SiClojure
cmd:SiWindows
conf:SiIni
cpp:SiCplusplus
cs:SiCsharp
css:SiCss3
cxx:SiCplusplus
dart:SiDart
docker:SiDocker
dockerfile:SiDocker
elm:SiElm
erl:SiErlang
ex:SiElixir
exs:SiElixir
f03:SiFortran
f08:SiFortran
f90:SiFortran
f95:SiFortran
fish:SiFish
for:SiFortran
ftn:SiFortran
go:SiGo
gql:SiGraphql
graphql:SiGraphql
h:SiC
hcl:SiTerraform
hpp:SiCplusplus
hrl:SiErlang
hs:SiHaskell
html:SiHtml5
ini:SiIni
java:SiJava
js:SiJavascript
json:SiJson
jsx:SiReact
kt:SiKotlin
less:SiLess
lhs:SiHaskell
lua:SiLua
m:SiObjectivec
md:SiMarkdown
ml:SiOcaml
mli:SiOcaml
mm:SiObjectivec
mysql:SiMysql
nasm:SiAssemblyscript
nix:SiNixos
pas:SiPascal
perl:SiPerl
php:SiPhp
pl:SiPerl
postgres:SiPostgresql
pp:SiPascal
proto:SiProtobuf
ps1:SiPowershell
py:SiPython
r:SiR
rb:SiRuby
rs:SiRust
s:SiAssemblyscript
sass:SiSass
scala:SiScala
scss:SiSass
sh:SiBash
sql:SiMysql
sqlite:SiSqlite
svelte:SiSvelte
swift:SiSwift
tf:SiTerraform
toml:SiToml
ts:SiTypescript
tsx:SiReact
vue:SiVuedotjs
xml:SiXml
yaml:SiYaml
yml:SiYaml
zsh:SiZsh
`
        .trim()
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => s.split(":"))
) as unknown as Record<string, keyof typeof icons>

export function getCodeIcon(extension: string): FC | null {
    if (icons[patterns[extension]]) return icons[patterns[extension]] as unknown as FC
    const name = `Si${extension[0]?.toUpperCase()}${extension.slice(1)}`
    if (icons[name as keyof typeof icons])
        return icons[name as keyof typeof icons] as unknown as FC
    return null
}

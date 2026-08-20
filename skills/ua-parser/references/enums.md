# Enums

Import from `<pkg>/enums`. Use with `.is()` or against `.name` / `.type` / `.architecture`.

Renames in **2.0.5**: `Browser`→`BrowserName`, `CPU`→`CPUArch`, `Device`→`DeviceType`, `Vendor`→`DeviceVendor`, `Engine`→`EngineName`, `OS`→`OSName`. Old identifiers are wrong on current types.

```ts
import {
  BrowserName,
  BrowserType,
  CPUArch,
  DeviceType,
  DeviceVendor,
  EngineName,
  OSName,
  Extension,
} from "ua-parser-js/enums";
```

String values of the enums are the runtime strings UAParser assigns (e.g. `DeviceType.MOBILE === "mobile"`). Prefer the enum over literals.

## BrowserType

`CRAWLER`, `CLI`, `EMAIL`, `FETCHER`, `INAPP`, `MEDIAPLAYER`, `LIBRARY`

Ordinary browsers have `browser.type === undefined` (no enum member for "browser").

## DeviceType

`CONSOLE`, `EMBEDDED`, `MOBILE`, `SMARTTV`, `TABLET`, `WEARABLE`, `XR`

Docs historically listed `DESKTOP`; **2.0.10 removed it**. Desktop/laptop → `device.type` **undefined**. `UAParser.DEVICE` static constants match the list above (no desktop).

## CPUArch

`68K`, `ALPHA`, `ARM`, `ARM_64`, `ARM_HF`, `AVR`, `AVR_32`, `IA64`, `IRIX`, `IRIX_64`, `MIPS`, `MIPS_64`, `PA_RISC`, `PPC`, `SPARC`, `SPARC_64`, `X86`, `X86_64`

Runtime architecture strings include values like `amd64` / `arm64`; compare via `.is(CPUArch.ARM)` rather than guessing spellings.

## EngineName

`AMAYA`, `ARKWEB`, `BLINK`, `DILLO`, `EDGEHTML`, `FLOW`, `GECKO`, `GOANNA`, `ICAB`, `KHTML`, `LIBWEB`, `LINKS`, `LYNX`, `NETFRONT`, `NETSURF`, `PRESTO`, `SERVO`, `TASMAN`, `TRIDENT`, `W3M`, `WEBKIT`

Blink = Chromium engine. Trident = old IE. EdgeHTML = legacy Edge.

## BrowserName (default parser)

`115`, `2345`, `360`, `ALIPAY`, `ALOHA`, `AMAYA`, `ANDROID`, `ARORA`, `ATLAS`, `AVANT`, `AVAST`, `AVG`, `AVIRA`, `BAIDU`, `BASILISK`, `BING`, `BLAZER`, `BOLT`, `BOWSER`, `BRAVE`, `CAMINO`, `CHIMERA`, `CHROME`, `CHROME_HEADLESS`, `CHROME_MOBILE`, `CHROME_WEBVIEW`, `CHROMIUM`, `COBALT`, `COC_COC`, `CONKEROR`, `DAUM`, `DILLO`, `DOLPHIN`, `DOOBLE`, `DORIS`, `DRAGON`, `DUCKDUCKGO`, `ECOSIA`, `EDGE`, `EDGE_WEBVIEW`, `EDGE_WEBVIEW2`, `EPIPHANY`, `FACEBOOK`, `FALKON`, `FIREBIRD`, `FIREFOX`, `FIREFOX_FOCUS`, `FIREFOX_MOBILE`, `FIREFOX_REALITY`, `FENNEC`, `FLOCK`, `FLOW`, `GO`, `GOOGLE_SEARCH`, `HELIO`, `HEYTAP`, `HIBROWSER`, `HONOR`, `HUAWEI`, `ICAB`, `ICE`, `ICEAPE`, `ICECAT`, `ICEDRAGON`, `ICEWEASEL`, `IE`, `INSTAGRAM`, `IRIDIUM`, `IRON`, `JASMINE`, `KONQUEROR`, `KAKAO`, `KHTML`, `K_MELEON`, `KLAR`, `KLARNA`, `KINDLE`, `LENOVO`, `LADYBIRD`, `LG`, `LIBREWOLF`, `LIEBAO`, `LIGHTHOUSE`, `LINE`, `LINKEDIN`, `LINKS`, `LUAKIT`, `LUNASCAPE`, `LYNX`, `MAEMO`, `MAXTHON`, `MIDORI`, `MINIMO`, `MIUI`, `MOZILLA`, `MOSAIC`, `NAVER`, `NETFRONT`, `NETSCAPE`, `NETSURF`, `NOKIA`, `NORTON`, `OBIGO`, `OCULUS`, `OMNIWEB`, `OPERA`, `OPERA_COAST`, `OPERA_GX`, `OPERA_MINI`, `OPERA_MOBI`, `OPERA_NEON`, `OPERA_TABLET`, `OPERA_TOUCH`, `OTTER`, `OVI`, `PALEMOON`, `PHANTOMJS`, `PHOENIX`, `PICOBROWSER`, `POLARIS`, `PUFFIN`, `QQ`, `QQ_LITE`, `QUARK`, `QUPZILLA`, `QUTEBROWSER`, `QWANT`, `REKONQ`, `ROCKMELT`, `SAFARI`, `SAFARI_MOBILE`, `SAILFISH`, `SAMSUNG`, `SEAMONKEY`, `SILK`, `SKYFIRE`, `SLEIPNIR`, `SLIMBOAT`, `SLIMBROWSER`, `SLIMJET`, `SNAPCHAT`, `SOGOU_EXPLORER`, `SOGOU_MOBILE`, `STEAM`, `SURF`, `SWIFTFOX`, `TESLA`, `TIKTOK`, `TIZEN`, `TWITTER`, `UC`, `UP`, `VIVALDI`, `VIVO`, `W3M`, `WATERFOX`, `WEBKIT`, `WECHAT`, `WEIBO`, `WHALE`, `WOLVIC`, `YANDEX`, `ZALO`

Example: `UAParser().browser.is(BrowserName.INSTAGRAM)` for Instagram in-app browser.

## DeviceVendor

`ACER`, `ADVAN`, `ALCATEL`, `AMAZON`, `ANBERNIC`, `APPLE`, `ARCHOS`, `ASUS`, `ATT`, `BENQ`, `BLACKBERRY`, `BLACKVIEW`, `BLU`, `CAT`, `COOLPAD`, `CUBOT`, `DELL`, `ENERGIZER`, `ESSENTIAL`, `FACEBOOK`, `FAIRPHONE`, `GEEKSPHONE`, `GENERIC`, `GOOGLE`, `HISENSE`, `HMD`, `HP`, `HTC`, `HUAWEI`, `IMO`, `INFINIX`, `ITEL`, `JOLLA`, `KOBO`, `LAVA`, `LENOVO`, `LG`, `LOGITECH`, `MEIZU`, `MICROMAX`, `MICROSOFT`, `MOTOROLA`, `NEXIAN`, `NINTENDO`, `NOKIA`, `NOTHING`, `NVIDIA`, `ONEPLUS`, `OPPO`, `OUYA`, `PALM`, `PANASONIC`, `PEBBLE`, `PHILIPS`, `PICO`, `POLYTRON`, `REALME`, `RETROID`, `RIM`, `ROKU`, `SAMSUNG`, `SHARP`, `SIEMENS`, `SMARTFREN`, `SONY`, `SPRINT`, `TCL`, `TECHNISAT`, `TECNO`, `TESLA`, `T_MOBILE`, `ULEFONE`, `VALVE`, `VIVO`, `VIZIO`, `VODAFONE`, `WIKO`, `XBOX`, `XIAOMI`, `ZEBRA`, `ZTE`

## OSName

`AIX`, `AMIGA_OS`, `ANDROID`, `ANDROID_X86`, `ARCAOS`, `ARCH`, `BADA`, `BEOS`, `BLACKBERRY`, `CENTOS`, `CHROME_OS`, `CHROMECAST`, `CHROMECAST_ANDROID`, `CHROMECAST_FUCHSIA`, `CHROMECAST_LINUX`, `CHROMECAST_SMARTSPEAKER`, `CONTIKI`, `DEBIAN`, `DEEPIN`, `DRAGONFLY`, `ELEMENTARY_OS`, `FEDORA`, `FIREFOX_OS`, `FREEBSD`, `FUCHSIA`, `GENTOO`, `GHOSTBSD`, `GNU`, `HAIKU`, `HARMONYOS`, `HP_UX`, `HURD`, `IOS`, `JOLI`, `KAIOS`, `KNOPPIX`, `KUBUNTU`, `LINPUS`, `LINSPIRE`, `LINUX`, `MACOS`, `MAEMO`, `MAGEIA`, `MANDRIVA`, `MANJARO`, `MEEGO`, `MINIX`, `MINT`, `MORPH_OS`, `NETBSD`, `NETRANGE`, `NETTV`, `NINTENDO`, `OPENHARMONY`, `OPENBSD`, `OPENVMS`, `OS2`, `PALM`, `PC_BSD`, `PCLINUXOS`, `PICO`, `PLAN9`, `PLAYSTATION`, `QNX`, `RASPBIAN`, `REDHAT`, `RIM_TABLET_OS`, `RISC_OS`, `SABAYON`, `SAILFISH`, `SERENITYOS`, `SERIES40`, `SLACKWARE`, `SOLARIS`, `SUSE`, `SYMBIAN`, `TIZEN`, `UBUNTU`, `UBUNTU_TOUCH`, `UNIX`, `VECTORLINUX`, `VEGA_OS`, `WATCHOS`, `WEBOS`, `WINDOWS`, `WINDOWS_CE`, `WINDOWS_IOT`, `WINDOWS_MOBILE`, `WINDOWS_PHONE`, `WINDOWS_RT`, `XBOX`, `XUBUNTU`, `ZENWALK`

## Extension.BrowserName (needs matching extension)

Access nested names:

```ts
const {
  BrowserName: { Fetcher, Crawler, CLI, Email, Library, InApp },
} = Extension;
```

### CLI

`CURL`, `ELINKS`, `HTTPIE`, `LYNX`, `POWERSHELL`, `WGET`

### Crawler (subset; list grows every release)

Includes search + AI crawlers, among others: `GOOGLE_BOT`, `GOOGLE_BOT_IMAGE`, `GOOGLE_EXTENDED`, `MICROSOFT_BINGBOT`, `OPENAI_GPTBOT`, `OPENAI_SEARCH_BOT`, `ANTHROPIC_CLAUDE_BOT`, `ANTHROPIC_CLAUDE_SEARCHBOT`, `PERPLEXITY_BOT`, `XAI_BOT`, `APPLE_BOT`, `META_FACEBOOKBOT`, `DUCKDUCKGO_BOT`, `YANDEX_BOT`, `AHREFS_BOT`, `SEMRUSH_BOT`, `COMMON_CRAWL_CCBOT`, `BYTESDANCE_TIKTOKSPIDER`, `HUGGINGFACE_BOT`, `DEEPSEEK_BOT`, `VERCEL_V0BOT`, …

Full current list: https://docs.uaparser.dev/api/submodules/enums/extension.html — refresh from docs rather than assuming this snapshot is complete.

### Email

`THUNDERBIRD`, `MICROSOFT_OUTLOOK`, `MICROSOFT_OUTLOOK_MAC`, `APPLE_MAIL`, `PROTON_MAIL`, `PROTON_MAIL_BRIDGE`, `AIRMAIL`, `SPARK_MAIL`, `K9_MAIL`, `SAMSUNG_EMAIL`, `TUTANOTA`, `ZIMBRA`, `ZOHO_MAIL`, …

### Fetcher

`OPENAI_CHATGPT_USER`, `ANTHROPIC_CLAUDE_USER`, `PERPLEXITY_USER`, `MISTRALAI_USER`, `GOOGLE_CHROME_LIGHTHOUSE`, `X_TWITTERBOT`, `SLACK_BOT`, `DISCORD_BOT`, `TELEGRAM_BOT`, `META_WHATSAPP`, `IFRAMELY`, `UPTIMEROBOT`, `VERCEL_BOT`, `AMAZON_NOVA_ACT`, `GOOGLE_GEMINI_DEEP_RESEARCH`, …

```ts
import { Fetchers } from "ua-parser-js/extensions";
import { Extension } from "ua-parser-js/enums";

const { BrowserName: { Fetcher } } = Extension;
const { browser } = UAParser(userAgent, Fetchers);
if (browser.is(Fetcher.OPENAI_CHATGPT_USER)) {
  // ChatGPT-User
}
```

### InApp

`DISCORD`, `EVERNOTE`, `FIGMA`, `FLIPBOARD`, `MATTERMOST`, `TEAMS`, `NOTION`, `POSTMAN`, `RAMBOX`, `ROCKETCHAT`, `SLACK`, `TIKTOK_LITE`, `VSCODE`, `YAHOO_JAPAN`

### Library

`AXIOS`, `UNDICI`, `NODE_FETCH`, `NODE_JS`, `BUN`, `DENO`, `PYTHON_REQUESTS`, `PYTHON_HTTPX`, `PYTHON_URLLIB`, `PYTHON_URLLIB3`, `OKHTTP`, `GOT`, `GUZZLEHTTP`, `SCRAPY`, `JSDOM`, `POSTMAN_RUNTIME`, `DART`, `JAVA`, `JAVA_HTTPCLIENT`, …

### Extension.DeviceVendor.Vehicle

`BMW`, `BYD`, `JEEP`, `RIVIAN`, `TESLA`, `VOLVO`

When matching crawler/fetcher **names**, load the extension first; otherwise `.is(Crawler.OPENAI_GPTBOT)` stays false.

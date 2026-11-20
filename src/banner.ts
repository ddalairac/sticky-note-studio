const TITLE = [
  "  ____  _   _      _            _   _       _        ",
  " / ___|| |_(_) ___| | ___   _  | \\ | | ___ | |_ ___  ",
  " \\___ \\| __| |/ __| |/ | | | | |  \\| |/ _ \\| __/ _ \\ ",
  "  ___) | |_| | (__|   <| |_| | | |\\  | (_) | ||  __/ ",
  " |____/ \\__|_|\\___|_|\\_\\\\__, | |_| \\_|\\___/ \\__\\___| ",
  "                        |___/                        ",
].join("\n");

const CREDITS = [
  " By Diego Dalairac                                   ",
  " Web: https://ddalairac.com                          ",
  " Github: https://github.com/ddalairac                ",
  " Linkedin: https://linkedin.com/in/ddalairac         ",
  "                                                     ",
].join("\n");

const STICKY_NOTE = ["color: #3d3424", "background-color: #C39C76", "color: #000"].join(";");

export function printConsoleBanner(): void {
  console.log(`%c${TITLE}\n${CREDITS}\n`, STICKY_NOTE);
}

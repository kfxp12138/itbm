import { Font } from '@react-pdf/renderer';
import path from 'path';

const fontPath = path.join(process.cwd(), 'src/fonts/NotoSansSC-Regular.ttf');

let fontsRegistered = false;

export function registerFonts() {
  if (fontsRegistered) return;
  
  Font.register({
    family: 'NotoSansSC',
    src: fontPath,
  });
  
  fontsRegistered = true;
}

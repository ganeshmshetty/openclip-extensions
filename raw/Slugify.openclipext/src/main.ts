// OpenClip extension entry point. Build with: npm run build
// The bridge types (openclip, OpenClipAction) come from openclip.d.ts in this folder.
import slugify from "slugify";

export const action: OpenClipAction = (selection) => {
  return slugify(selection, { lower: true, strict: true });
};
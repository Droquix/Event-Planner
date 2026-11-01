export interface IdeaItem {
  title: string;
  whyItFits: string;
  costRange: string;
}

export const DEFAULT_IDEAS: IdeaItem[] = [
  {
    title: 'Live Regional Food Station',
    whyItFits: 'Elevates catering with interactive culinary engagement for your guests.',
    costRange: '₹15,000 – ₹35,000',
  },
  {
    title: 'Drone Aerial Highlights & Teaser Video',
    whyItFits: 'Enhances photography priority with cinematic outdoor venue perspectives.',
    costRange: '₹20,000 – ₹40,000',
  },
  {
    title: 'Bespoke Floral Photo-Op Backdrop',
    whyItFits: 'Creates a striking focal point for guest portraits while optimizing decor spend.',
    costRange: '₹18,000 – ₹30,000',
  },
  {
    title: 'Acoustic Welcome Duo',
    whyItFits: 'Sets an inviting ambience during guest arrivals without overpowering conversation.',
    costRange: '₹12,000 – ₹25,000',
  },
  {
    title: 'Personalized Guest Welcome Hampers',
    whyItFits: 'Adds a warm hospitality touch with locally sourced treats tailored to your city.',
    costRange: '₹10,000 – ₹22,000',
  },
];

export function formatInr(val: number): string {
  return '₹' + Math.round(val).toLocaleString('en-IN');
}

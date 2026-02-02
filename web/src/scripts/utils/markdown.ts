import { Marked } from 'marked';
import { katexExtensions } from '@/scripts/utils/katex'; 

const marked = new Marked();
marked.use(katexExtensions());

export default marked;

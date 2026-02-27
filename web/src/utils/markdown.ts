import { Marked } from 'marked';
import { katexExtensions } from '@/utils/katex'; 

const marked = new Marked();
marked.use(katexExtensions());

export default marked;

import { PRODUCT_SORTS } from '@sellmanager/shared';
import { listSearchSchema } from '@/lib/listSearch';

/** Estado da lista de produtos na URL: ?q=&page=&sort=&order= */
export const productsSearchSchema = listSearchSchema(PRODUCT_SORTS);

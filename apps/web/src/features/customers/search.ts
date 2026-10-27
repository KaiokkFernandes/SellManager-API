import { CUSTOMER_SORTS } from '@sellmanager/shared';
import { listSearchSchema } from '@/lib/listSearch';

/** Estado da lista de clientes na URL: ?q=&page=&sort=&order= */
export const customersSearchSchema = listSearchSchema(CUSTOMER_SORTS);

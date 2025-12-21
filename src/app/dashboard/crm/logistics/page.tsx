import { getLogisticsMontages } from './actions';
import { LogisticsView } from './_components/logistics-view';

export default async function LogisticsPage() {
    const montages = await getLogisticsMontages();
    return <LogisticsView initialMontages={montages} />;
}

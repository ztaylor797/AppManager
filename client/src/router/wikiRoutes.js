// Note the "path" does not directly correlate to the component import path. One is a URL path, the other a directory path.
// The path is used to generate the breadcrumbs, so the pasts should be nested with /parent/child/childofchild syntax
// For these wiki routes, the "markdownName" prop should match the name of the .vmd file in the /wiki dir without the .vmd extension on it
const genWikiRoute = (path, markdownName) => {
    return {
        path: `wiki/${path}`,
        component: () => import('pages/Wiki.vue'),
        props: { markdownName }
    };
}

const wikiRoutes = [
    genWikiRoute('', 'WikiHome'),

    genWikiRoute('QaLanding', 'QaLanding'),
    genWikiRoute('QaLanding/QaSchemasMaster', 'QaSchemasMaster'),
    genWikiRoute('QaLanding/QaBT', 'QaBT'),
    genWikiRoute('QaLanding/QaProcessBtPricing', 'QaProcessBtPricing'),
    genWikiRoute('QaLanding/QaNBS', 'QaNBS'),
    genWikiRoute('QaLanding/QaLateFeeLikelihood', 'QaLateFeeLikelihood'),
    genWikiRoute('QaLanding/QaRcli', 'QaRcli'),
    genWikiRoute('QaLanding/QaScraBulkUpload', 'QaScraBulkUpload'),
    genWikiRoute('QaLanding/QaSysprinAgent', 'QaSysprinAgent'),
    genWikiRoute('QaLanding/QaSysprin', 'QaSysprin'),
    genWikiRoute('QaLanding/QaProcessRuleDataForceStartBox', 'QaProcessRuleDataForceStartBox'),
    genWikiRoute('QaLanding/QaProcessRPI', 'QaProcessRPI'),

    genWikiRoute('ProdLanding', 'ProdLanding'),
    genWikiRoute('ProdLanding/ProdBT', 'ProdBT'),
    genWikiRoute('ProdLanding/ProdRcli', 'ProdRcli'),
    genWikiRoute('ProdLanding/ProdScraBulkUpload', 'ProdScraBulkUpload'),
    genWikiRoute('ProdLanding/ProdSysprin', 'ProdSysprin'),
    genWikiRoute('ProdLanding/ProdSysprinAgent', 'ProdSysprinAgent')
];

export default wikiRoutes;

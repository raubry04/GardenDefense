import { Router } from 'express';
import { ASSET_REVIEW_CATALOG, REVIEW_STORAGE_KEY } from '../../scripts/assetReviewCatalog.mjs';

const router = Router();

router.get('/catalog', (_req, res) => {
  res.json({ catalog: ASSET_REVIEW_CATALOG, storageKey: REVIEW_STORAGE_KEY });
});

export default router;

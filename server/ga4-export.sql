-- Flattens the purchase events of Google's public GA4 sample
-- (bigquery-public-data.ga4_obfuscated_sample_ecommerce: real, obfuscated
-- Google Merchandise Store data from 2020-11-01 to 2021-01-31) into the grain
-- of our sales table: one row per purchased item line.
--
-- Run it once in the BigQuery console (the free sandbox is enough), then
-- "Save results" → "CSV (local file)" and store the file as
-- server/data/ga4-purchases.csv. `npm run import` loads it into DuckDB and
-- adds derived columns (month, week, order size, visitor type, ...).
--
-- Notes on the data:
-- - Obfuscation leaves placeholders such as '<Other>', NULL or '' in some
--   fields; the import turns NULL and '' into '(not set)'.
-- - geo is derived from the IP address of the visit: where the purchase was
--   made, not where the customer lives. There is no age or gender.
-- - traffic_source is the channel that first acquired the user, not the one
--   of the purchasing session.
-- - Timestamp is UTC, the time zone event_date uses in this property; the
--   import warns if both disagree.
-- - Always empty in the sample, hence not exported: geo.metro,
--   items.item_category2-5, items.item_list_name, items.coupon.
SELECT
  -- time and order
  PARSE_DATE('%Y%m%d', event_date) AS Date,
  FORMAT_TIMESTAMP('%F %T', TIMESTAMP_MICROS(event_timestamp)) AS Timestamp,
  -- purchases without a transaction id are identified by the event itself
  IF(IFNULL(ecommerce.transaction_id, '') IN ('', '(not set)'),
     CONCAT(user_pseudo_id, '-', CAST(event_timestamp AS STRING)),
     ecommerce.transaction_id) AS TransactionId,
  -- visitor
  (SELECT p.value.int_value FROM UNNEST(event_params) AS p WHERE p.key = 'ga_session_number') AS SessionNumber,
  DIV(event_timestamp - user_first_touch_timestamp, 86400000000) AS DaysSinceFirstVisit,
  -- location at purchase time
  geo.continent AS Continent,
  geo.sub_continent AS SubContinent,
  geo.country AS Country,
  geo.region AS Region,
  geo.city AS City,
  -- acquisition
  traffic_source.medium AS Medium,
  traffic_source.source AS Source,
  traffic_source.name AS Campaign,
  -- device
  device.category AS DeviceCategory,
  device.operating_system AS OperatingSystem,
  device.operating_system_version AS OperatingSystemVersion,
  device.web_info.browser AS Browser,
  device.language AS Language,
  device.mobile_brand_name AS MobileBrand,
  device.mobile_model_name AS MobileModel,
  -- item
  item.item_category AS ItemCategory,
  item.item_brand AS ItemBrand,
  item.item_name AS ItemName,
  item.item_variant AS ItemVariant,
  item.promotion_name AS PromotionName,
  -- facts
  item.quantity AS Quantity,
  item.price_in_usd AS Price,
  COALESCE(item.item_revenue_in_usd, item.price_in_usd * item.quantity) AS Revenue
FROM `bigquery-public-data.ga4_obfuscated_sample_ecommerce.events_*`, UNNEST(items) AS item
WHERE event_name = 'purchase'

with ranked_images as (
  select
    id,
    row_number() over (
      partition by product_id
      order by sort_order asc, image_url asc
    ) - 1 as next_sort_order
  from product_images
)
update product_images
set sort_order = ranked_images.next_sort_order
from ranked_images
where product_images.id = ranked_images.id;

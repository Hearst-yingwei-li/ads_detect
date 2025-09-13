# from playwright.sync_api import sync_playwright
from playwright.async_api import async_playwright
from typing import List, Dict
import asyncio
import requests
import math
import time
import csv
import re
import pandas as pd

file_index = 0

DIFY_URL = f"http://35.213.67.93/csv/batch_{file_index}.json"
BASIC_AUTH_NAME = "55oshie-ru"
BASIC_AUTH_PW = "log4me"

VIEWPORT_WIDTH = 393
VIEWPORT_HEIGHT = 742
PADDING_TITLE = 7
PADDING_IMAGE = 10
PADDING_DEK = 52
PADDING_SLIDE = 32
THRESHOLD_HEIGHT = 660
LINE_HEIGHT_BR = 25.6

#----- for dek test -----
dek_np = {"mos_id":[],"slide_index":[],"ori_html":[],'tag':[]}


def render_description_block(description_html: str):
    return f"""
    <div id="dek" class="meta-wrapper">
        <div class="inner-wrapper">
            {description_html}
        </div>
        <div class="bottom-gap"></div>
    </div>
    """


async def measure_slide_number(page, slide_number) -> int:
    script = f"""
    () => {{
        const wrapper = document.createElement('div');
        wrapper.style.width = '393px';
        wrapper.style.position = 'absolute';
        wrapper.style.visibility = 'hidden';
        wrapper.style.left = '-9999px';
        document.body.appendChild(wrapper);

        const number = document.createElement('span');
        number.innerText = `{slide_number}`;
        number.style.fontSize = '36px';
        number.style.lineHeight = '50.4px';
        number.style.width = '393px';
        number.style.display = 'block';
        wrapper.appendChild(number);

        const height = number.offsetHeight;

        // Cleanup
        document.body.removeChild(wrapper);

        return height;
    }}
    """
    return await page.evaluate(script)


async def measure_title(page, title_text: str) -> int:
    script = f"""
    () => {{
        const wrapper = document.createElement('div');
        wrapper.style.width = '393px';
        wrapper.style.position = 'absolute';
        wrapper.style.visibility = 'hidden';
        wrapper.style.left = '-9999px';
        document.body.appendChild(wrapper);

        const h2 = document.createElement('h2');
        h2.innerText = `{title_text}`;
        h2.style.fontSize = '24px';
        h2.style.lineHeight = '31.2px';
        h2.style.marginBottom = '16px';
        h2.style.padding = '0 16px';
        h2.style.textAlign = 'center';
        h2.style.boxSizing = 'border-box';

        wrapper.appendChild(h2);

        const height = h2.offsetHeight;

        document.body.removeChild(wrapper);

        return height;
    }}
    """
    return await page.evaluate(script)

async def measure_dek(page, description_html: str) -> int:
    # Escape backticks and embed the HTML safely
    escaped_html = description_html.replace("`", "\\`")
    # match = re.search(r'<div class="inner-wrapper">\s*<([a-zA-Z0-9]+)', escaped_html)
    # if match:
    #     tag = match.group(1)
    #     if tag == 'p':
    #         pass
    #     else:
    #         print("First tag:", match.group(1))
    #         print(f'html --- {escaped_html}')
    #         paragraph_matches = re.findall(r"<p[^>]*>([\s\S]*?)<\/p>", description_html, flags=re.IGNORECASE)
    #         meaningful_paragraphs = [
    #             content for content in paragraph_matches
    #             if re.sub(r'&nbsp;|\uFEFF|\s+', '', content)  # remove whitespace, &nbsp;, BOM
    #         ]
    #         print(f'meaningfull_paragraphs ------------ {meaningful_paragraphs}')

    # else:
    #     pass
        # print("Not found")
        # print(f'html --- {escaped_html}')
    # --------------------------------------------------------------------------------------
    # const paragraphMatches = [...descriptionHTML.matchAll(/<p[^>]*>([\\s\\S]*?)<\\/p>/gi)];
    script = f"""
    () => {{
        const descriptionHTML = `{escaped_html}`;

        const paragraphMatches = [...descriptionHTML.matchAll(/<(p|li|h2|h3|h4|figure|iframe)[^>]*>([\\s\\S]*?)<\\/\\1>/gi)];
        const meaningfulParagraphs = paragraphMatches.filter(match => {{
            const tag = match[1].toLowerCase();
            const content = match[2].replace(/&nbsp;|\\uFEFF|\\s+/g, '');
            if (tag === "figure" || tag === "iframe") {{
            return true;
        }}
            return content.length > 0;
        }});

        if (meaningfulParagraphs.length === 0) {{
            return 0;
        }}

        const wrapper = document.createElement('div');
        wrapper.style.width = '393px';
        wrapper.style.position = 'absolute';
        wrapper.style.visibility = 'hidden';
        wrapper.style.left = '-9999px';
        wrapper.style.boxSizing = 'border-box';
        document.body.appendChild(wrapper);

        const leadOuter = document.createElement('div');
        leadOuter.style.boxSizing = 'border-box';
        leadOuter.style.paddingLeft = '16px';
        leadOuter.style.paddingRight = '16px';
        leadOuter.style.display = 'block';

        const leadInner = document.createElement('div');
        leadInner.style.boxSizing = 'border-box';
        leadInner.style.display = 'block';
        leadInner.innerHTML = descriptionHTML;

        leadInner.querySelectorAll('p').forEach(p => {{
            p.style.fontSize = '16px';
            p.style.lineHeight = '25.6px';
            p.style.marginTop = '16px';
            p.style.marginBottom = '16px';
            p.style.boxSizing = 'border-box';
        }});
        
        leadInner.querySelectorAll('li').forEach(li => {{
            li.style.fontSize = '16px';
            li.style.lineHeight = '25.6px';
            li.style.marginTop = '0px';
            li.style.marginBottom = '10px';
            li.style.boxSizing = 'border-box';
        }});
        
        leadInner.querySelectorAll('h2').forEach(h2 => {{
            h2.style.fontSize = '24px'; 
            h2.style.lineHeight = '32px';
            h2.style.fontWeight = 'bold';
            h2.style.marginTop = '28px'; 
            h2.style.marginBottom = '10px';
            h2.style.boxSizing = 'border-box';
        }});
        
        leadInner.querySelectorAll('h3').forEach(h3 => {{
            h3.style.fontSize = '18.72px'; 
            h3.style.lineHeight = '28px';
            h3.style.fontWeight = 'bold';
            h3.style.marginTop = '30px'; 
            h3.style.marginBottom = '30px';
            h3.style.boxSizing = 'border-box';
        }});
        
        leadInner.querySelectorAll('h4').forEach(h4 => {{
            h4.style.fontSize = '16px'; 
            h4.style.lineHeight = '21px';
            h4.style.fontWeight = 'bold';
            h4.style.marginTop = '10px'; 
            h4.style.marginBottom = '10px';
            h4.style.boxSizing = 'border-box';
        }});
        
        leadInner.querySelectorAll('hr').forEach(hr => {{
            hr.style.marginTop = '30px'; 
            hr.style.marginBottom = '30px';
            hr.style.boxSizing = 'border-box';
        }});
        
        leadInner.querySelectorAll('figure').forEach(fig => {{
            fig.style.display = 'block';
            fig.style.marginTop = '16px';
            fig.style.marginBottom = '16px';
            fig.style.boxSizing = 'border-box';
            fig.style.width = '100%';
        }});
        
        leadInner.querySelectorAll('iframe').forEach(frame => {{
            frame.style.display = 'block';
            frame.style.maxWidth = '100%';
            frame.style.width = '100%';   // responsive
            frame.style.height = frame.getAttribute('height') || '281px';
            frame.style.marginTop = '10px';
            frame.style.marginBottom = '10px';
            frame.style.boxSizing = 'border-box';
        }});

        leadOuter.appendChild(leadInner);
        wrapper.appendChild(leadOuter);

        const height = leadOuter.offsetHeight;

        document.body.removeChild(wrapper);
        return height;
    }}
    """
    dek_h = await page.evaluate(script)
    # print(f'dek_h :: {dek_h}')
    return dek_h


async def measure_instagram_embed_html(page, embed_html: str) -> int:
    """
    Measures the height of an Instagram embed by setting the page content.
    This provides a clean, isolated environment for each measurement.
    """
    if not embed_html or not embed_html.strip():
        return THRESHOLD_HEIGHT

    # The container will constrain the width to simulate the device.
    # iPhone 16 viewport is 393px. With 16px padding on each side, content width is 361px.
    html_content = f"""
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {{ margin: 0; }}
          .instagram-wrapper {{
              /* 393px (viewport) - 16px padding left/right */
              width: 361px; 
              margin: 0 auto;
          }}
        </style>
      </head>
      <body>
        <div class="instagram-wrapper">
          {embed_html}
        </div>
        <script async src="https://www.instagram.com/embed.js"></script>
      </body>
    </html>
    """

    # Set the page content. This is a robust way to ensure a clean slate.
    await page.set_content(html_content, wait_until="load")

    # The script should run on load, but we can nudge it just in case.
    await page.evaluate("window.instgrm?.Embeds?.process?.()")

    # Wait for the blockquote to be "hydrated" by the script and have a size.
    try:
        selector = ".instagram-wrapper .instagram-media"
        await page.wait_for_function(
            f"() => document.querySelector('{selector}') && document.querySelector('{selector}').offsetHeight > 0",
            timeout=10000,
        )

        # Measure the height of the wrapper element containing the embed.
        height = await page.locator(".instagram-wrapper").evaluate(
            "el => el.offsetHeight"
        )
        return height
    except Exception as e:
        print(f"Instagram embed failed to render or timed out: {e}")
        return THRESHOLD_HEIGHT


async def measure_instagram_permalink_height(page, permalink_url: str) -> int:
    html = f"""
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=393, initial-scale=1.0" />
        <style>
          body {{
            margin: 0;
            padding: 0;
          }}
          .instagram-wrapper {{
            margin-left: 16px;
            margin-right: 16px;
          }}
        </style>
      </head>
      <body>
        <div class="instagram-wrapper">
          <blockquote 
            class="instagram-media" 
            data-instgrm-captioned 
            data-instgrm-permalink="{permalink_url}" 
            data-instgrm-version="14"
            style="width: 100%; max-width: 393px;">
          </blockquote>
        </div>
        <script async src="https://www.instagram.com/embed.js"></script>
      </body>
    </html>
    """

    await page.set_content(html, wait_until="load")

    # Force Instagram to reprocess embeds if the script has already loaded
    await page.evaluate("window.instgrm?.Embeds?.process?.()")

    # Wait for hydration
    await page.wait_for_function(
        """
        () => {
            const el = document.querySelector('.instagram-media');
            return el && el.offsetHeight > 0;
        }
    """,
        timeout=5000,
    )

    return await page.evaluate(
        """
        () => {
            const el = document.querySelector('.instagram-media');
            return el ? el.offsetHeight : 0;
        }
    """
    )


async def measure_pinterest_embed(page, pinterest_url: str) -> int:
    script = f"""
    () => {{
        return new Promise((resolve) => {{
            function loadScript(callback) {{
                if (window.PinUtils && typeof window.PinUtils.build === 'function') {{
                    return callback();
                }}
                const script = document.createElement('script');
                script.src = 'https://assets.pinterest.com/js/pinit_main.js';
                script.async = true;
                script.onload = callback;
                document.head.appendChild(script);
            }}

            loadScript(() => {{
                const container = document.createElement('div');
                container.style.width = '393px';
                container.style.position = 'absolute';
                container.style.left = '-9999px';
                container.style.top = '0';
                container.style.visibility = 'hidden';

                const pin = document.createElement('a');
                pin.setAttribute('data-pin-do', 'embedPin');
                pin.setAttribute('data-pin-width', 'medium');
                pin.setAttribute('href', '{pinterest_url}');
                container.appendChild(pin);
                document.body.appendChild(container);

                window.PinUtils.build();

                const start = performance.now();
                const maxWait = 3000;

                function check() {{
                    const pinEl = container.querySelector('.PIN_');
                    if (pinEl && pinEl.offsetHeight > 0) {{
                        const height = container.offsetHeight;
                        container.remove();
                        resolve(height);
                    }} else if (performance.now() - start > maxWait) {{
                        const height = container.offsetHeight;
                        container.remove();
                        resolve(height);
                    }} else {{
                        requestAnimationFrame(check);
                    }}
                }}
                check();
            }});
        }});
    }}
    """
    return await page.evaluate(script)


async def measure_loop_video_embed(page, video_filename, path=None) -> int:
    if path:
        video_url = f"https://media.hearstapps.net/loop/{path}/{video_filename}"
    else:
        video_url = f"https://media.hearstapps.net/loop/{video_filename}"
    js_script = f"""
    () => {{
        return new Promise((resolve) => {{
            const container = document.createElement('div');
            container.style.width = '393px';
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.style.top = '0';
            container.style.visibility = 'hidden';

            const video = document.createElement('video');
            video.src = "{video_url}";
            video.setAttribute('muted', '');
            video.setAttribute('playsinline', '');
            video.setAttribute('preload', 'metadata');
            video.style.width = '100%';
            video.style.display = 'block';

            container.appendChild(video);
            document.body.appendChild(container);

            let settled = false;

            const fallback = setTimeout(() => {{
                if (!settled) {{
                    settled = true;
                    document.body.removeChild(container);
                    resolve(220);  // fallback
                }}
            }}, 3000);

            video.addEventListener('loadedmetadata', () => {{
                if (!settled) {{
                    settled = true;
                    clearTimeout(fallback);
                    const aspectRatio = video.videoHeight / video.videoWidth;
                    const height = 393 * aspectRatio;
                    document.body.removeChild(container);
                    resolve(height);
                }}
            }});
        }});
    }}
    """
    result = await page.evaluate(js_script)
    return round(result)


async def measure_slide_heights(page, slide: Dict) -> Dict:
    slide_number = slide.get("slide_number", "")
    title = slide.get("title", "")
    dek = render_description_block(slide.get("dek", ""))

    # Basic elements
    slide_number_h = 0
    if slide_number:
        slide_number_h = await measure_slide_number(page, slide_number=slide_number)

    title_h = 0
    if title:
        title_h = await measure_title(page, title_text=title)

    desc_h = 0
    if dek:
        desc_h = await measure_dek(page, description_html=dek)

    # Image
    img_h = slide.get("screen_height_image", 0)

    # Youtube
    youtube_h = slide.get("screen_height_youtube", 0)

    # Pinterest
    pinterest_h = 0
    url_pinterest = slide.get("url_pinterest", None)
    if url_pinterest:
        try:
            if 'instagram' in url_pinterest:
                if url_pinterest.startwith('<blockquote'):
                    pinterest_h = await measure_instagram_embed_html(
                page, url_pinterest)
                else:
                    pinterest_h = THRESHOLD_HEIGHT
            else:
                pinterest_h = await measure_pinterest_embed(page, url_pinterest)
        except:
            pinterest_h = 0

    # Instagram
    instagram_h = 0
    instagram_url = slide.get("url_instagram", None)
    instagram_embed_code = slide.get("embed_code_instagram", None)
    if instagram_embed_code:
        # print("Measuring Instagram content via embed code.")
        try:
            # insta_page = await context.new_page()
            # FIX: Correctly call the robust function and assign to instagram_h
            instagram_h = await measure_instagram_embed_html(
                page, instagram_embed_code
            )  # FIXME:FOR TEST instagram_embed_code
        except Exception as e:
            # print(f"An exception occurred while measuring Instagram embed code: {e}")
            instagram_h = THRESHOLD_HEIGHT
    elif instagram_url and "instagram.com/p/" in instagram_url:
        # print(f"Measuring Instagram content via permalink: {instagram_url}")
        # TODO: TEST generate embed_code from LLM
        instagram_h = THRESHOLD_HEIGHT
    
        
    # Loop/file
    loop_h = 0
    file_path = slide.get("path", None)
    file_name = slide.get("file_name", None)
    if file_path and file_name:
        try:
            loop_h = await measure_loop_video_embed(page, file_path, file_name)
        except:
            loop_h = 0
    # print(f"<< Loop height = {loop_h}")

    # Video
    video_h = slide.get("video_height", 0)
    # print(f"<< video height = {video_h}")

    # Product
    title_product = slide.get("title_product", "")
    title_product_h = 0
    if title_product:
        title_product_h = await measure_title(page, title_text=title_product)

    dek_product = slide.get("dek_product", "")
    dek_product_h = 0
    if dek_product:
        dek_product_h = await measure_dek(page, description_html=dek_product)
    image_height_product = slide.get("image_height_product", 0)
    show_price = slide.get("show_price", False)
    product_price_height = 47 + 16.8 if show_price else 0
    # print(
    #     f"title_product={title_product}  dek_product = {dek_product}  image_height_product = {image_height_product}  show_price = {show_price}"
    # )

    return {
        "slide_number": slide_number_h,
        "title_height": title_h,
        "description_height": desc_h,
        "image_height": img_h,
        "youtube_height": youtube_h,
        "pinterest_height": pinterest_h,
        "instagram_height": instagram_h,
        "loop_height": loop_h,
        "video_height": video_h,
        "image_height_product": image_height_product,
        "title_product_height": title_product_h,
        "dek_product_height": dek_product_h,
        "product_price_height": product_price_height,
        "total_height": slide_number_h
        + title_h
        + desc_h
        + img_h
        + youtube_h
        + pinterest_h
        + instagram_h
        + loop_h
        + video_h
        + image_height_product
        + title_product_h
        + dek_product_h
        + product_price_height
        + PADDING_TITLE
        + PADDING_IMAGE
        + PADDING_DEK
        + PADDING_SLIDE,
    }

async def get_from_db():
    response = requests.get(DIFY_URL, auth=(BASIC_AUTH_NAME, BASIC_AUTH_PW))
    response.raise_for_status()  # raise an error if the request failed
    data = response.json()  # parse JSON into a Python object
    return data


async def check_height_result(calcluated_height, slide):
    total_height = calcluated_height.get("total_height", 0)
    dek = slide.get("dek")
    if total_height >= THRESHOLD_HEIGHT:
        return None
    br_count = math.ceil((THRESHOLD_HEIGHT - total_height) / 25.6)
    br_tags = "<br>" * br_count
    br_block = f'<p class="__auto-inserted-br__">{br_tags}</p>'
    return dek + br_block

async def process_slide(context, page, media, slide):
    try:
        is_instagram = slide.get("embed_code_instagram") or "instagram.com/p/" in slide.get("url_instagram", "") or 'instagram' in slide.get("url_pinterest","")
        if is_instagram:
            insta_page = await context.new_page()
            try:
                height_result = await measure_slide_heights(insta_page, slide)
                dek_br = await check_height_result(height_result, slide)
            finally:
                await insta_page.close()
        else:
            height_result = await measure_slide_heights(page, slide)
            dek_br = await check_height_result(height_result, slide)

        if dek_br:
            return {
                "site_prefix": media.get("site"),
                "section_slug": slide.get("section_slug"),
                "id": media.get("mos_id"),
                "slide_no": slide.get("index"),
                "dek": dek_br,
            }
    except Exception as e:
        print(f"Slide failed (mos_id={media.get('mos_id')}  site_prefix={media.get("site")} slide_no={slide.get("index")}): {e}")
        return None
    

# async def get_height(data):
#     time_start = time.time()
#     async with async_playwright() as p:
#         browser = await p.chromium.launch(headless=True)
#         # 1. Create a new, isolated browser context for this media item
#         context = await browser.new_context(viewport={"width": 393, "height": 800})
#         # context = await browser.new_context(**p.devices["iPhone 15 Pro"])

#         # 2. Create a single, reusable page for all non-Instagram slides
#         page = await context.new_page()

#         fix_slides = []
#         # count = 0
#         for media in data:
#             # if count > 1:
#             #     continue
#             # print(f'media --- {media}')
#             # count+=1
#             # context = None
#             try:
#                 slides = media.get("slides", [])
#                 # Run all slide tasks concurrently
#                 slide_tasks = [
#                     process_slide(context, page, media, slide) for slide in slides
#                 ]
#                 results = await asyncio.gather(*slide_tasks, return_exceptions=True)
#                 fix_slides.extend([r for r in results if isinstance(r, dict)])
#             except Exception as e:
#                 print(
#                     f"!! FATAL: Could not process media item. Error: {e}"
#                 )
#             # finally:
#             #     if context:
#             #         await context.close()

#         print(f"modified result ---- {len(fix_slides)}")
#         await context.close()
#         await browser.close()
#         diff = time.time() - time_start
#         print(f"Execution time: {diff:.4f} seconds")
#         return fix_slides
#         output_file = f"test_sos_out.csv"

#         # Write to CSV
#         with open(output_file, mode="w", newline="", encoding="utf-8") as csvfile:
#             writer = csv.DictWriter(csvfile, fieldnames=fix_slides[0].keys(), quoting=csv.QUOTE_ALL)
#             writer.writeheader()  # write column headers
#             writer.writerows(fix_slides)

#         print(f"CSV saved to: {output_file}")

async def main():
    data = await get_from_db()
    print(f'get from db --- {len(data)}')
    #------------------------------------------
    df = pd.read_csv('out_un_p_tag.csv', encoding='utf-8')
    #------------------------------------------

    time_start = time.time()
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 393, "height": 800})
        # 1. Create a new, isolated browser context for this media item
        # context = await browser.new_context(**p.devices["iPhone 15 Pro"])

        # 2. Create a single, reusable page for all non-Instagram slides
        page = await context.new_page()

        fix_slides = []
        # count = 0
        for media in data:
            # ---- FIXME: fix <p> tag only issus in dek
            # if count > 500:
            #     break
            # count += 1
            
            # context = None
            try:
                mos_id = media.get('mos_id',"")
                #------------------------------------------
                if not mos_id or mos_id not in df['id'].values:
                    continue
                #------------------------------------------
                print(f'mos_id ---- {mos_id}')
                slides = media.get("slides", [])
                # Run all slide tasks concurrently
                slide_tasks = [
                    process_slide(context, page, media, slide) for slide in slides
                ]
                results = await asyncio.gather(*slide_tasks, return_exceptions=True)
                fix_slides.extend([r for r in results if isinstance(r, dict)])
            except Exception as e:
                print(
                    f"!! FATAL: Could not process media item {media.get('mos_id')}. Error: {e}"
                )
            # finally:
            #     if context:
            #         await context.close()
            # print(f'mos_id ---- {mos_id}')

        print(f"modified result ---- {len(fix_slides)}")
        await context.close()
        await browser.close()
        diff = time.time() - time_start
        print(f"Execution time: {diff:.4f} seconds")

        output_file = f"batch_{file_index}.csv"

        # Write to CSV
        if fix_slides:
            with open(output_file, mode="w", newline="", encoding="utf-8") as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=fix_slides[0].keys(), quoting=csv.QUOTE_ALL)
                writer.writeheader()  # write column headers
                writer.writerows(fix_slides)

            print(f"CSV saved to: {output_file}")


if __name__ == "__main__":
    asyncio.run(main())

const EmbedType = Object.freeze({
    IMAGE: 'image',
    INSTAGRAM: 'instagram',
    VIDEO: 'video',
    YOUTUBE: 'youbube',
    PINTEREST: 'pinterest',
    PRODUCTS: 'products',
    LOOP: 'loop',
});

function extractSlideDataFromDOM() {
    // 1. Check if 'listicle' radio is selected
    const selectedRadio = document.querySelector('input[name="display_type"]:checked');
    if (!selectedRadio || selectedRadio.getAttribute('data-display-type-name') !== 'listicle') {
        alert('リスティクルが選択されていません。');
        return;
    }

    // 2. Check if 'hide-breaker-ads' is checked
    const breakerAdsCheckbox = document.getElementById('hide-breaker-ads-checkbox');
    if (breakerAdsCheckbox && breakerAdsCheckbox.checked) {
        alert('「記事内挿入広告を非表示(PC&SP)」がチェックされていません。');
        return;
    }

    // 3. Check if 'hide-list-number' is checked
    const listNumberCheckbox = document.getElementById('hide-list-number-checkbox');
    const isHideListicleNo = listNumberCheckbox ? listNumberCheckbox.checked : false;

    const slides = document.querySelectorAll('.gallery-slide-items-container .gallery-item');
    const results = [];
    slides.forEach((slide, index) => {
        if (index === slides.length - 1) return;
        const embedType = getEmbedType(slide);
        console.log(`<<<<< slide :: ${index + 1} embed type ::${embedType}`);
        const slideId = slide.id;

        // 1. タイトル input (text value)
        const titleInput = slide.querySelector(`input[name*="[metadata][headline]"]`);
        const title = titleInput ? titleInput.value.trim() : '';

        // 2. リード content (keep <p> tags inside the editor)
        const leadEditor = slide.querySelector('.redactor-editor');
        const leadHTML = leadEditor ? leadEditor.innerHTML.trim() : '';

        const checkbox = slide.querySelector(`input[type="checkbox"][id*="skip-slide-numbering-${slideId}"]`);
        const isHideSlideNumber = checkbox ? checkbox.checked : false;

        results.push({
            id: slideId,
            index: index + 1,
            hideListicleNo: isHideListicleNo,
            hideSlideNo: isHideSlideNumber,
            title: title,
            leadHTML: leadHTML,
            embedType: embedType,
            slideElement: slide
        });
    });
    return results;
}

function getEmbedType(slideElement) {
    if (isInstagramEmbed(slideElement)) return EmbedType.INSTAGRAM;
    if (isYoutubeEmbed(slideElement)) return EmbedType.YOUTUBE;
    if (isVideoEmbed(slideElement)) return EmbedType.VIDEO;
    if (isPinterestEmbed(slideElement)) return EmbedType.PINTEREST;
    if (isLoopEmbed(slideElement)) return EmbedType.LOOP;
    if (isProductsEmbed(slideElement)) return EmbedType.PRODUCTS;
    if (isImageEmbed(slideElement)) return EmbedType.IMAGE;
    return null;
}

function isYoutubeEmbed(slideElement) {
    const embedDiv = slideElement.querySelector('.drop-zone .embed');
    if (!embedDiv) return false;

    // Case 1: classList includes 'youtube'
    if (embedDiv.classList.contains('youtube')) {
        return true;
    }

    // Case 2: generic 'embed' class, check iframe src
    const iframe = embedDiv.querySelector('iframe');
    if (!iframe) return false;
    const src = iframe.getAttribute('src') || iframe.getAttribute('data-src') || '';
    return src.includes('youtube.com') || src.includes('youtu.be');
}

function isInstagramEmbed(slideElement) {
    const embedDiv = slideElement.querySelector('.drop-zone .embed');
    if (!embedDiv) return false;
    if (embedDiv.classList.contains('instagram')) return true;
    const iframe = embedDiv.querySelector('iframe');
    if (!iframe) return false;
    // TODO: FIXME: instagram
    if (iframe.classList.contains('instagram-media')) return true;
    return false;
}

function isPinterestEmbed(slideElement) {
    const embedDiv = slideElement.querySelector('.drop-zone .embed');
    if (!embedDiv) return false;
    if (embedDiv.classList.contains('pinterest')) return true;
    const iframe = embedDiv.querySelector('iframe');
    if (!iframe) return false;
    if (iframe.classList.contains('pinterest')) return true;
    return false;
}

function isVideoEmbed(slideElement) {
    const embedDiv = slideElement.querySelector('.drop-zone .embed');
    if (!embedDiv) return false;

    const wrapperDiv = embedDiv.querySelector('div[class~="video-frame"]')
    if (wrapperDiv) {
        return true;
    }
    return false;
}

function isImageEmbed(slideElement) {
    const embedDiv = slideElement.querySelector('img.edit');
    return embedDiv;
}

function isLoopEmbed(slideElement) {
    return slideElement.querySelector('.loop-wrapper') !== null;
}

function isProductsEmbed(slideElement) {
    return slideElement.querySelector('fieldset[class*="product"]') != null;
}

function getInstagramEmbedCode(slide) {
    const input = slide.slideElement.querySelector('input.gallery-metadata-url');
    const inputValue = input ? input.value : '';
    return inputValue;
}

function getPinterestEmbedCode(slide) {
    const input = slide.slideElement.querySelector('input[data-embed-type="pinterest"]');
    const inputValue = input ? input.value : '';
    return inputValue;
}

function getLoopUrl(slide) {
    const videoUrl = slide.slideElement.querySelector('.loop-wrapper video');
    return videoUrl ? videoUrl.getAttribute('src') : null;
}

function getVideoAspectRatio(slide) {
    const iframe = slide.slideElement.querySelector('iframe');
    const iframeSrc = iframe ? iframe.getAttribute('src') : null;
    const ratioMatch = iframeSrc.match(/aspect_ratio=(\d+):(\d+)/);
    if (!ratioMatch) return 0;
    const w = parseInt(ratioMatch[1], 10);
    const h = parseInt(ratioMatch[2], 10);
    if (!w || !h) return 0;
    return (h / w)
}

// ------------------------ calculate embed element height ------------------------------
function calculateImageScreenHeight(slide) {
    const img = slide.slideElement.querySelector('img.edit');
    if (!img) return 0;
    const width = img.getAttribute('data-width');
    const height = img.getAttribute('data-height');
    const crop = img.getAttribute('data-selected-crop');
    if (!width || !height) return 0;

    if (crop && crop !== 'freeform') {
        const match = crop.match(/^(\d+)x(\d+)$/);
        if (match) {
            const w = parseInt(match[1]);
            const h = parseInt(match[2]);
            const cropRatio = h / w; // height-to-width ratio
            const croppedHeight = width * cropRatio;
            const scaledHeight = croppedHeight * (393 / width);
            return scaledHeight + 10;
        }
    }
    return height * 393 / width + 10;// margin bottom : 10
}



/**
 * 1.Why simple url does not work( why can not do the same way as pinterest )
 * Instagram disallows rendering inside iframes on other domains unless it's processed through their embed script, 
 * and only when the content is served from a secure, compatible origin.
    Which means:
    Even though instgrm.Embeds.process() injects the iframe,
    Instagram’s server blocks it from loading due to the 
    X-Frame-Options: DENY header. 

    2. call meta api
    https://developers.facebook.com/docs/instagram-platform/oembed
 * 
 */
async function simulateInstagramEmbedHeight(instagramUrl) {
    // await new Promise((resolve) => {
    //     if (window.instgrm && typeof window.instgrm.Embeds?.process === 'function') {
    //         return resolve();
    //     }
    //     const script = document.createElement('script');
    //     script.src = 'https://www.instagram.com/embed.js';
    //     script.async = true;
    //     script.onload = resolve;
    //     document.head.appendChild(script);
    // });
    // // Create hidden container
    // const container = document.createElement('div');
    // container.style.width = '361px';
    // container.style.position = 'absolute';
    // container.style.left = '-9999px';
    // container.style.top = '0';
    // container.style.visibility = 'hidden';

    // // Create blockquote
    // const blockquote = document.createElement('blockquote');
    // blockquote.className = 'instagram-media';
    // blockquote.setAttribute('data-instgrm-permalink', instagramUrl);
    // blockquote.setAttribute('data-instgrm-version', '14');
    // blockquote.style.margin = '0';
    // blockquote.style.padding = '0';
    // blockquote.style.width = '100%';

    // const a = document.createElement('a');
    // a.href = instagramUrl;
    // a.target = '_blank';
    // blockquote.appendChild(a);

    // container.appendChild(blockquote);
    // document.body.appendChild(container);

    // // Call Instagram's embed renderer
    // window.instgrm.Embeds.process();

    // // Wait until Instagram embed renders
    // const embedHeight = await new Promise((resolve) => {
    //     const maxWait = 5000;
    //     const start = performance.now();

    //     const check = () => {
    //         const iframe = container.querySelector('iframe');
    //         const height = iframe?.offsetHeight || container.offsetHeight;
    //         if (iframe && height > 50) {
    //             resolve(height);
    //         } else if (performance.now() - start > maxWait) {
    //             resolve(height); // return even if 0 after timeout
    //         } else {
    //             requestAnimationFrame(check);
    //         }
    //     };
    //     check();
    // });
    // Clean up
    // document.body.removeChild(container);
    // return embedHeight;
    return 0;
}

async function simulatePinterestEmbedHeight(pinterestUrl) {
    // Load Pinterest script if not already present
    await new Promise((resolve) => {
        if (window.PinUtils && typeof window.PinUtils.build === 'function') {
            return resolve();
        }
        const script = document.createElement('script');
        script.src = 'https://assets.pinterest.com/js/pinit_main.js';
        script.async = true;
        script.onload = resolve;
        document.head.appendChild(script);
    });

    // Create hidden container
    const container = document.createElement('div');
    container.style.width = '393px';
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.visibility = 'hidden';

    // Create Pinterest anchor
    const pin = document.createElement('a');
    pin.setAttribute('data-pin-do', 'embedPin');
    pin.setAttribute('data-pin-width', 'medium');
    pin.setAttribute('href', pinterestUrl);
    container.appendChild(pin);
    document.body.appendChild(container);

    // Build the Pinterest embed
    window.PinUtils.build();

    // Wait until Pinterest embed renders
    const embedHeight = await new Promise((resolve) => {
        const maxWait = 3000; // max 3 seconds
        const start = performance.now();

        function check() {
            const pinEl = container.querySelector('.PIN_');
            if (pinEl && pinEl.offsetHeight > 0) {
                resolve(container.offsetHeight);
            } else if (performance.now() - start > maxWait) {
                resolve(container.offsetHeight); // fallback
            } else {
                requestAnimationFrame(check);
            }
        }
        check();
    });

    // Clean up
    document.body.removeChild(container);

    return embedHeight;
}

async function simulateLoopEmbedHeight(videoUrl) {
    // Convert to rendered CDN version if needed
    const convertedUrl = (() => {
        const match = videoUrl.match(/videos\/(.+\.mp4)/);
        if (!match) return videoUrl;
        return `https://media.hearstapps.net/loop/video/${match[1]}`;
    })();

    // Create hidden container
    const container = document.createElement('div');
    container.style.width = '393px';
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.visibility = 'hidden';

    // Create video element
    const video = document.createElement('video');
    video.src = convertedUrl;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('preload', 'metadata');
    video.style.width = '100%';
    video.style.display = 'block';

    container.appendChild(video);
    document.body.appendChild(container);

    // Wait for metadata to load
    const embedHeight = await new Promise((resolve) => {
        let settled = false;

        const fallbackTimeout = setTimeout(() => {
            if (!settled) {
                settled = true;
                resolve(container.offsetHeight || 220); // fallback
            }
        }, 3000);

        video.addEventListener('loadedmetadata', () => {
            if (!settled) {
                settled = true;
                clearTimeout(fallbackTimeout);
                const aspectRatio = video.videoHeight / video.videoWidth;
                const height = 393 * aspectRatio;
                resolve(height);
            }
        });
    });

    // Clean up
    document.body.removeChild(container);

    return embedHeight;
}

function extractProductSlideInfo(slide) {
    const result = {};

    // 1. Show Price checkbox status
    const showPriceCheckbox = slide.slideElement.querySelector('input[name*="[media_object][show_price]"]');
    result.showPrice = showPriceCheckbox ? showPriceCheckbox.checked : false;

    // 2. Custom Name (Product Title)
    const titleInput = slide.slideElement.querySelector('input[name*="[media_object][custom_name]"]');
    result.title = titleInput ? titleInput.value.trim() : '';

    // 3. Product Description (from redactor-editor)
    const descriptionEditor = slide.slideElement.querySelector('.redactor-editor');
    result.description = descriptionEditor ? descriptionEditor.innerHTML.trim() : '';

    // 4. Custom Tag
    const customTagInput = slide.slideElement.querySelector('input[name*="[metadata][custom_tag]"]');
    result.customTag = customTagInput ? customTagInput.value.trim() : '';
    // console.log(`show price :${result.showPrice}  title: ${result.title}  dec = ${result.description}  tag = ${result.customTag}`);
    // Get list price input
    const listPriceInput = slide.slideElement.querySelector('input[name*="[retailer][listprice]"]');
    // Get sale price input
    const salePriceInput = slide.slideElement.querySelector('input[name*="[retailer][price]"]');

    if (!listPriceInput || !salePriceInput) {
        return false;
    }

    const listPrice = Number(listPriceInput.value);
    const salePrice = Number(salePriceInput.value);

    result.onSale = listPrice > salePrice;
    return result;
}
async function simulateProductTextHeight(slide) {
    const slideData = extractProductSlideInfo(slide);
    if (slideData == null) return 0;
    const wrapper = document.createElement('div');
    wrapper.style.width = '393px';
    wrapper.style.position = 'absolute';
    wrapper.style.visibility = 'hidden';
    wrapper.style.left = '-9999px';
    wrapper.style.top = '0';
    wrapper.style.fontFamily = `"Hiragino Kaku Gothic ProN", Meiryo, sans-serif`;
    wrapper.style.lineHeight = '1.5';
    wrapper.style.boxSizing = 'border-box';

    // Custom tag
    if (slideData.customTag) {
        const customTag = document.createElement('div');
        customTag.innerText = slideData.customTag;
        Object.assign(customTag.style, {
            boxSizing: 'border-box',
            display: 'block',
            fontFamily: `"Hiragino Kaku Gothic ProN", Meiryo, sans-serif`,
            fontSize: '11.2045px',
            letterSpacing: 'normal',
            lineHeight: '13.4454px',
            marginLeft: '16px',
            marginRight: '16px',
            textAlign: 'center',
            textTransform: 'uppercase',
            textSizeAdjust: '100%',
            unicodeBidi: 'isolate',
            wordBreak: 'break-word',
            WebkitFontSmoothing: 'antialiased',
        });

        wrapper.appendChild(customTag);
    }

    // Title
    if (slideData.title) {
        const h2 = createH2Element(slideData.title);
        wrapper.appendChild(h2);
    }

    // Dec
    if (slideData.description) {
        const leadOuter = createDescription(slideData.description);
        if (leadOuter) {
            wrapper.appendChild(leadOuter);
        }
    }
    document.body.appendChild(wrapper);
    const height = wrapper.offsetHeight;
    document.body.removeChild(wrapper);
    return height;
}
// ------------------------------------------------------

function createH2Element(title) {
    const h2 = document.createElement('h2');
    h2.innerText = title;
    h2.style.fontSize = '24px';
    h2.style.lineHeight = '31.2px';
    h2.style.marginBottom = '16px';
    h2.style.padding = '0 16px';
    h2.style.textAlign = 'center';
    return h2;
}

function createDescription(descriptionHTML) {
    const paragraphMatches = [...descriptionHTML.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
    const meaningfulParagraphs = paragraphMatches.filter(match => {
        const content = match[1].replace(/&nbsp;|\uFEFF|\s+/g, ''); // remove &nbsp;, zero-width space, and normal whitespace
        return content.length > 0;
    });
    const paragraphCount = meaningfulParagraphs.length;
    if (paragraphCount > 0) {
        const leadOuter = document.createElement('div');
        leadOuter.style.boxSizing = 'border-box';
        leadOuter.style.paddingLeft = '16px';
        leadOuter.style.paddingRight = '16px';
        leadOuter.style.display = 'block';

        const leadInner = document.createElement('div');
        leadInner.style.boxSizing = 'border-box';
        leadInner.style.display = 'block';

        // Inject the <p> tags
        leadInner.innerHTML = descriptionHTML;

        // Style each <p> tag
        const paragraphs = leadInner.querySelectorAll('p');
        paragraphs.forEach(p => {
            p.style.fontSize = '16px';
            p.style.lineHeight = '25.6px';
            p.style.marginTop = '16px';
            p.style.marginBottom = '16px';
            p.style.boxSizing = 'border-box';
        });

        leadOuter.appendChild(leadInner);
        // wrapper.appendChild(leadOuter);
        return leadOuter;
    }
    return null;
}

async function simulateIPhoneChromeSlideOverflow(slide) {
    const wrapper = document.createElement('div');
    wrapper.style.width = '393px';
    wrapper.style.position = 'absolute';
    wrapper.style.visibility = 'hidden';
    wrapper.style.left = '-9999px';
    wrapper.style.top = '0';
    wrapper.style.fontFamily = `"Hiragino Kaku Gothic ProN", Meiryo, sans-serif`;
    wrapper.style.lineHeight = '1.5';
    wrapper.style.boxSizing = 'border-box';

    // Slide Number
    if (!slide.hideSlideNo && !slide.hideListicleNo) {
        const number = document.createElement('span');
        number.innerText = slide.number;
        number.style.fontSize = '36px';
        number.style.lineHeight = '50.4px';
        number.style.width = '393px';
        number.style.display = 'block';
        wrapper.appendChild(number);
    }

    // Title
    if (slide.title) {
        const h2 = createH2Element(slide.title);
        wrapper.appendChild(h2);
    }

    // Embed Element
    let embedHeight = 0;
    switch (slide.embedType) {
        case EmbedType.IMAGE:
            embedHeight = calculateImageScreenHeight(slide);
            break;
        case EmbedType.INSTAGRAM:
            const instagramInputValue = getInstagramEmbedCode(slide);
            if (instagramInputValue) {
                if (instagramInputValue.includes('blockquote')) {
                    // embed code
                    const instaWrapper = document.createElement('div');
                    instaWrapper.innerHTML = instagramInputValue;
                    wrapper.appendChild(instaWrapper);
                } else {
                    // only url is
                    embedHeight = await simulateInstagramEmbedHeight(instagramInputValue);
                    embedHeight = embedHeight + 32; //margin bottom:32
                }
            }
            embedHeight = 32; // margin top:0 bottom:32 
            break;
        case EmbedType.YOUTUBE:
            embedHeight = 9 / 16 * 363; // margin on horizontal
            break;
        case EmbedType.VIDEO:
            const aspectRatio = getVideoAspectRatio(slide)
            embedHeight = aspectRatio * 393 + 32; // margin bottom:32
            break;
        case EmbedType.PINTEREST:
            // if <iframe> is known, get weight and height, calculate the heigh
            // if only url is known, calculate height seperately
            const pinterestInputValue = getPinterestEmbedCode(slide);
            if (pinterestInputValue) {
                if (pinterestInputValue.includes('iframe')) {
                    // embed code 
                    const widthMatch = pinterestInputValue.match(/width="(\d+)"/);
                    const heightMatch = pinterestInputValue.match(/height="(\d+)"/);
                    if (widthMatch && heightMatch) {
                        const originalWidth = parseInt(widthMatch[1]);
                        const originalHeight = parseInt(heightMatch[1]);
                        // element width in iPhone 16 (margin: 16*2)
                        const viewportWidth = 343;
                        embedHeight = (originalHeight / originalWidth) * viewportWidth;
                    } else {
                        console.error("Could not extract width and/or height from embed code.");
                    }
                } else {
                    // only url
                    embedHeight = await simulatePinterestEmbedHeight(pinterestInputValue);
                    embedHeight = embedHeight + 32; //margin bottom:32
                }
            }
            break
        case EmbedType.LOOP:
            const loopUrl = getLoopUrl(slide);
            embedHeight = await simulateLoopEmbedHeight(loopUrl) + 15; //margin bottom: 15
            break
        case EmbedType.PRODUCTS:
            embedHeight = calculateImageScreenHeight(slide);
            const slideData = extractProductSlideInfo(slide);
            let textHeight = await simulateProductTextHeight(slide);
            if(slideData.showPrice){
                if (slideData.onSale){
                    textHeight = textHeight + 116;
                }else{
                    textHeight = textHeight + 60;
                }
            }else{
                textHeight = textHeight + 63;
            }
            embedHeight = embedHeight + textHeight;
            break;
        default:
            break;
    }

    // Lead (meta)
    if (slide.leadHTML) {
        const leadOuter = createDescription(slide.leadHTML);
        if (leadOuter) {
            wrapper.appendChild(leadOuter);
        }
        // const paragraphMatches = [...slide.leadHTML.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
        // const meaningfulParagraphs = paragraphMatches.filter(match => {
        //     const content = match[1].replace(/&nbsp;|\uFEFF|\s+/g, ''); // remove &nbsp;, zero-width space, and normal whitespace
        //     return content.length > 0;
        // });
        // const paragraphCount = meaningfulParagraphs.length;
        // if (paragraphCount > 0) {
        //     const leadOuter = document.createElement('div');
        //     leadOuter.style.boxSizing = 'border-box';
        //     leadOuter.style.paddingLeft = '16px';
        //     leadOuter.style.paddingRight = '16px';
        //     leadOuter.style.display = 'block';

        //     const leadInner = document.createElement('div');
        //     leadInner.style.boxSizing = 'border-box';
        //     leadInner.style.display = 'block';

        //     // Inject the <p> tags
        //     leadInner.innerHTML = slide.leadHTML;

        //     // Style each <p> tag
        //     const paragraphs = leadInner.querySelectorAll('p');
        //     paragraphs.forEach(p => {
        //         p.style.fontSize = '16px';
        //         p.style.lineHeight = '25.6px';
        //         p.style.marginTop = '16px';
        //         p.style.marginBottom = '16px';
        //         p.style.boxSizing = 'border-box';
        //     });

        //     leadOuter.appendChild(leadInner);
        //     wrapper.appendChild(leadOuter);
        // }
    }


    // Add to document, measure, remove
    document.body.appendChild(wrapper);
    if (slide.embedType == EmbedType.PINTEREST) {
        const script = document.createElement('script');
        script.setAttribute('async', '');
        script.setAttribute('defer', '');
        script.src = '//assets.pinterest.com/js/pinit.js';
        document.body.appendChild(script);
    }
    const height = wrapper.offsetHeight + embedHeight + 16 * 2;
    console.log(`index:  ${slide.index}  \ntotal height ---- ${height}  \nwrapper height ---- ${wrapper.offsetHeight}  \nembededHeight height ----- ${embedHeight}`);
    document.body.removeChild(wrapper);

    return {
        height,
        overlapping: height < 670 - 40 // ads margin top:20 bottom:20
    };
}

(async function () {
    const slides = extractSlideDataFromDOM();
    if (!slides) {
        return;
    }

    // const results = slides.map(slide => {
    //     const simulation = simulateIPhoneChromeSlideOverflow(slide);
    //     return {
    //         slide: slide.index,
    //         height: simulation.height,
    //         overlapping: simulation.overlapping
    //     };
    // });


    let results = []
    for (const slide of slides) {
        const simulation = await simulateIPhoneChromeSlideOverflow(slide);
        results.push({
            slide: slide.index,
            height: simulation.height,
            overlapping: simulation.overlapping
        });
    }

    console.table(results);
    const overlappingSlides = results
        .filter(r => r.overlapping)
        .map(r => r.slide)
        .join(', ');

    const overlappingCount = overlappingSlides ? overlappingSlides.split(',').length : 0;
    if (overlappingCount > 0) {
        alert(`Audited ${results.length} slides.\n ${overlappingCount} overlapping.\nSlide index: ${overlappingSlides}`);
    }
})();

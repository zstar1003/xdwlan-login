import { Browser, type BrowserPage, type Response, type Element } from "happy-dom";

const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:137.0) Gecko/20100101 Firefox/137.0";

// A virtual browser that simulates fetch and DOM manipulation.
class VirtualBrowser {
	private browser: Browser;
	public page: BrowserPage;
	private scriptsBlackList: string[];

	constructor() {
		this.browser = new Browser({
			settings: {
				navigator: {
					userAgent: userAgent,
				},
				disableJavaScriptFileLoading: true,
				disableJavaScriptEvaluation: true,
				disableCSSFileLoading: true,
				disableComputedStyleRendering: true,
			},
			// You can enable console for debug.
			// console: global.console,
		});
		this.page = this.browser.newPage();
		this.scriptsBlackList = ["main.js"];
	}

	/** Fetch script content from URL.
	 *
	 * @param url script URL
	 * @returns
	 */
	private async fetchScript(url: URL): Promise<string> {
		console.debug(`[virtual-browser] fetch ${url.href}`);
		return fetch(url, {
			mode: "no-cors",
			method: "GET",
			referrer: this.page.url,
			headers: {
				"User-Agent": userAgent,
				Accept: "*/*",
				"Accept-Language": "zh-CN,en-US;q=0.7,en;q=0.3",
				"Sec-GPC": "1",
				"Sec-Fetch-Dest": "script",
				"Sec-Fetch-Mode": "no-cors",
				"Sec-Fetch-Site": "same-origin",
			},
		}).then((resp) => resp.text());
	}

	/** Evaluate the script in current page context.
	 *
	 * Happy-DOM's evaluation sometimes differs from what I expected.
	 * So I set disableJavaScriptFileLoading and disableJavaScriptEvaluation to true, then evalute it by myself.
	 *
	 * @param element script element, either remote script or inline.
	 */
	private async evaluateScriptTag(element: Element): Promise<void> {
		const src = element.getAttribute("src");
		if (src) {
			// remote script
			const url = new URL(`${this.page.mainFrame.window.location.origin}/${src}`);
			for (const disabledScript of this.scriptsBlackList) {
				if (url.pathname.endsWith(disabledScript)) {
					console.debug(`[virtual-browser] skip ${url.href}`);
					return;
				}
			}

			const code = await this.fetchScript(url);
			console.debug(`[virtual-browser] evaluate ${src}`);
			this.page.evaluate(code);
		} else if (element.innerHTML) {
			// inline script
			console.debug("[virtual-browser] evaluate inline script");
			this.page.evaluate(element.innerHTML);
		}
	}

	async goto(url: string): Promise<Response | null> {
		const resp = await this.page.goto(url);
		await this.page.waitUntilComplete();

		// Handle meta refresh tag
		for (const element of this.page.mainFrame.document.head.children) {
			if (element.tagName === "META" && element.getAttribute("http-equiv") === "refresh") {
				const metaContent = element.getAttribute("content");
				if (metaContent !== null) {
					const subUrl = metaContent.split(";url=", 2)[1];
					if (subUrl) {
						const url = `${this.page.mainFrame.document.location.origin}/${subUrl}`;
						return this.goto(url);
					}
				}
			}
		}

		// Evaluate script tag in HEAD and BODY
		for (const element of this.page.mainFrame.document.head.children) {
			if (element.tagName === "SCRIPT") {
				await this.evaluateScriptTag(element);
			}
		}
		for (const element of this.page.mainFrame.document.body.children) {
			if (element.tagName === "SCRIPT") {
				await this.evaluateScriptTag(element);
			}
		}

		// In fact, I don't know what this actually does and whether it matters.
		// So I just leave it here, or you can tell me if you know more.
		await this.page.waitUntilComplete();

		return resp;
	}
}

function checkEnvVars() {
	if (!process.env.XDWLAN_LOGIN_URL) {
		throw new Error("XDWLAN_LOGIN_URL is not set");
	}
	if (!process.env.XDWLAN_USERNAME) {
		throw new Error("XDWLAN_USERNAME is not set");
	}
	if (!process.env.XDWLAN_PASSWORD) {
		throw new Error("XDWLAN_PASSWORD is not set");
	}
	if (!process.env.XDWLAN_DOMAIN) {
		throw new Error("XDWLAN_DOMAIN is not set");
	}
}

/** Simulate login to Xidian University WLAN.
 *
 * @returns true if login successfully, false otherwise.
 */
async function main(): Promise<boolean> {
	checkEnvVars();

	const browser = new VirtualBrowser();
	await browser.goto(process.env.XDWLAN_LOGIN_URL); // It is usually https://w.xidian.edu.cn/index_8.html

	// Automatically login
	if (browser.page.mainFrame.window.location.pathname === "/srun_portal_success") {
		console.debug("[virtual-browser] successfully logged in.");
		return true;
	}

	// Manually login
	browser.page.evaluate(
		`
      (function() {
          window.xdwlan_login = { message: "not yet" };
          var portal = new Portal(CONFIG);
          portal.userInfo.username = '@username_placeholder@';
          portal.userPassword      = '@password_placeholder@';
          portal.userInfo.domain   = '@domain_placeholder@';

          portal.login({
              type: 'account',
              success: function () {
                  window.xdwlan_login = { message: "ok" };
              }
          });
      })()
      `
			.replace("@username_placeholder@", process.env.XDWLAN_USERNAME)
			.replace("@password_placeholder@", process.env.XDWLAN_PASSWORD)
			.replace("@domain_placeholder@", process.env.XDWLAN_DOMAIN),
	);
	await browser.page.waitUntilComplete();

	// @ts-ignore
	if (browser.page.mainFrame.window.xdwlan_login.message === "ok") {
		console.debug("[virtual-browser] successfully logged in.");
		return true;
	}

	return false;
}

main();

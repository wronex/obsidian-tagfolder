import { SUBTREE_MARK, TreeItem, ViewItem, TagFolderItem, EPOCH_DAY, EPOCH_HOUR, FRESHNESS_1, FRESHNESS_2, FRESHNESS_3, FRESHNESS_4, FRESHNESS_5, tagDispDict, TagFolderSettings } from "types";

export function unique<T>(items: T[]) {
	return [...new Set<T>([...items])];
}
export function allTags(entry: TagFolderItem): string[] {
	if ("tags" in entry) return entry.tags;
	return unique([...(entry?.descendants ?? []).flatMap(e => e.tags), ...entry.children.flatMap(e => "tag" in e ? allTags(e) : e.tags).filter(e => e)]);
}

export function isAutoExpandTree(entry: TreeItem, setting: TagFolderSettings) {
	if (setting.doNotSimplifyTags) return false;
	if ("tag" in entry) {

		const childrenTags = entry.children.filter(
			(e) => "tag" in e
		) as TreeItem[];
		const childrenItems = (entry.allDescendants ?? entry.children).filter(
			(e) => "tags" in e
		) as ViewItem[];
		if (childrenTags.length == 0) return false;
		if (entry.itemsCount == 1) return true;
		if (childrenTags.length == 1 && childrenItems.length == 0) {
			// Only one tag and no children
			return true;
		}

		if (childrenTags.length == 1 && childrenItems.length > 1) {
			// Check all children can be unified
			const sTags = allTags(entry).join("-").toLocaleLowerCase();
			for (const child of childrenItems) {
				const cTags = allTags(child).join("-").toLocaleLowerCase();
				if (sTags != cTags) {
					return false;
				}
			}
			return true;
		}
	}
	return false;
}

export function omittedTags(entry: TreeItem, setting: TagFolderSettings): false | string[] {
	if (setting.doNotSimplifyTags) return false;
	const childrenTags = entry.children.filter(
		(e) => "tag" in e
	) as TreeItem[];
	const childrenItems = (entry.allDescendants ?? entry.children).filter(
		(e) => "tags" in e
	) as ViewItem[];

	// If children is already parsed, pass.
	if (childrenTags.length > 0) return false;
	// If child has been identified unique.
	const tx = childrenItems.map((e) => [...e.tags].sort().join("-"));
	if (tx.length != 1 && entry.itemsCount != 1) return false;
	// When any tags are left, add mark to title.
	const tags = unique(childrenItems.flatMap(e => e.tags));
	const ancestorTags = ancestorToTags(entry.ancestors).map(e => e.toLocaleLowerCase());
	const lastT = tags.filter((e) => !ancestorTags.contains(e.toLocaleLowerCase()));

	if (lastT.length) {
		return lastT;
	}
	return false;
}

export function ancestorToTags(ancestors: string[]): string[] {
	const SUBTREE_MARK_LENGTH = SUBTREE_MARK.length;
	return ancestors.reduce(
		(p, i) =>
			!i.startsWith(SUBTREE_MARK)
				? [...p, i]
				: [
					...p,
					p.pop() +
					"/" +
					i.substring(SUBTREE_MARK_LENGTH),
				],
		[]
	)
}
export function ancestorToLongestTag(ancestors: string[]): string[] {
	return ancestors.reduceRight((a: string[], e) => !a ? [e] : (a[0].startsWith(e) ? a : [e, ...a]), null)
}


export function isSpecialTag(tagSrc: string) {
	const tag = tagSrc.startsWith(SUBTREE_MARK)
		? tagSrc.substring(SUBTREE_MARK.length)
		: tagSrc;
	return tag == "_untagged" || tag in tagDispDict;
}

export function renderSpecialTag(tagSrc: string) {
	const tag = tagSrc.startsWith(SUBTREE_MARK)
		? tagSrc.substring(SUBTREE_MARK.length)
		: tagSrc;
	return tag in tagDispDict ? tagDispDict[tag] : tagSrc;

}

export function secondsToFreshness(totalAsMSec: number) {
	const totalAsSec = ~~(totalAsMSec / 1000);
	const sign = totalAsSec / Math.abs(totalAsSec);
	const totalSec = ~~(totalAsSec * sign);
	if (totalSec < EPOCH_HOUR) return FRESHNESS_1
	if (totalSec < EPOCH_HOUR * 6) return FRESHNESS_2
	if (totalSec < EPOCH_DAY * 3) return FRESHNESS_3
	if (totalSec < EPOCH_DAY * 7) return FRESHNESS_4
	return FRESHNESS_5
}


const queues = [] as (() => void)[];
function pump() {
	requestAnimationFrame(() => {
		const proc = queues.shift();
		if (proc) {
			proc();
			pump();
		}
	});
}
// The message pump having ancient name.
export const doEvents = () => {

	return new Promise<void>(res => {
		const proc = () => {
			res();
		};
		queues.push(proc);
		pump();
	})
}


export const compare = (Intl && Intl.Collator) ? (new Intl.Collator().compare) :
	(x: string, y: string) => (`${x ?? ""}`).localeCompare(`${y ?? ""}`);


//TODO:TIDY
export function pickEntry(entry: TagFolderItem, path: string | string[], past: string[] = []): TagFolderItem | null {
	const paths = typeof path == "string" ? path.split("/").slice(1) : path;
	const [head, ...tail] = paths;

	if (!entry) return null;
	if (!head) return entry;

	if (!("children" in entry)) {
		if (past.contains(head)) {
			return pickEntry(entry, tail, [...past, head.toLocaleLowerCase()]);
		} else {
			console.log("Picked leaf is not leaf")
			return null;
		}
	}
	const next = entry.children.find(e => "tag" in e && compare(e.tag, head) == 0);
	if (!next) {
		if (past.contains(head)) {
			return pickEntry(entry, tail, [...past, head.toLocaleLowerCase()]);
		} else {
			console.log("Picking leaf looks something wrong")
			return null;
		}
	}
	return pickEntry(next, tail, [...past, head.toLocaleLowerCase()]);
}
import { WorkspaceLeaf, type ViewState } from "obsidian";
import TagFolderViewComponent from "./TagFolderViewComponent.svelte";
import { VIEW_TYPE_TAGFOLDER, type TREE_TYPE, VIEW_TYPE_TAGFOLDER_LINK } from "./types";
import TagFolderPlugin from "./main";
import { TagFolderViewBase } from "./TagFolderViewBase";


export interface TagFolderViewState extends ViewState {
	treeViewType: TREE_TYPE
}
export class TagFolderView extends TagFolderViewBase {
	icon: "stacked-levels";
	treeViewType?: TREE_TYPE;

	getIcon(): string {
		return "stacked-levels";
	}

	constructor(leaf: WorkspaceLeaf, plugin: TagFolderPlugin, viewType: TREE_TYPE) {
		super(leaf);
		this.plugin = plugin;

		this.showMenu = this.showMenu.bind(this);
		this.showOrder = this.showOrder.bind(this);
		this.newNote = this.newNote.bind(this);
		this.showLevelSelect = this.showLevelSelect.bind(this);
		this.switchView = this.switchView.bind(this);
		this.treeViewType = viewType;
		// this.setState({ viewType: this.viewType, type: this.getViewType() }, {});
	}

	newNote(evt: MouseEvent) {
		//@ts-ignore
		this.app.commands.executeCommandById("file-explorer:new-file");
	}

	getViewType() {
		return this.treeViewType == "tags" ? VIEW_TYPE_TAGFOLDER : VIEW_TYPE_TAGFOLDER_LINK;
	}

	getDisplayText() {
		return this.treeViewType == "tags" ? "Tag Folder" : "Link Folder";
	}

	async onOpen() {
		this.containerEl.empty();
		this.component = new TagFolderViewComponent({
			target: this.containerEl,
			props: {
				openFile: this.plugin.focusFile,
				hoverPreview: this.plugin.hoverPreview,
				vaultName: this.app.vault.getName(),
				showMenu: this.showMenu,
				showLevelSelect: this.showLevelSelect,
				showOrder: this.showOrder,
				newNote: this.newNote,
				openScrollView: this.plugin.openScrollView,
				isViewSwitchable: this.plugin.settings.useMultiPaneList,
				switchView: this.switchView,
				viewType: this.treeViewType
			},
		});
	}

	async onClose() {
		this.component.$destroy();
	}

}

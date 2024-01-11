import OutlineButton from "@/options/components/common/outlineButton/outlineButton";
import Input from "@options/components/common/input/input";
import Dialog from "@/options/components/dialog/dialog";
import Tooltip from "@options/components/common/tooltip/tooltip";
import PlaySVG from "@assets/icons/play.svg";
import ShareSVG from "@assets/icons/share.svg";
import TrashSVG from "@assets/icons/trash.svg";
import LoaderSVG from "@assets/icons/loader.svg";
import ClipboardSVG from "@assets/icons/clipboard.svg";
import { ListHeader, ListItems } from "@options/components/common/list/list";
import { Link } from "react-router-dom";
import { timeDifference } from "@utils/timeDifference";
import { cutString } from "@utils/cutString";

export const LIST_HEADERS: ListHeader[] = [
  {
    title: "Name",
    render: function () {
      return this.title;
    },
  },
  {
    title: "URL",
    render: function () {
      return this.title;
    },
  },
  {
    title: "Date",
    render: function () {
      return this.title;
    },
  },
  {
    title: "Duration",
    classes: "flex justify-end",
    render: function () {
      return this.title;
    },
  },
  {
    title: "Actions",
    classes: "flex justify-end",
    render: function () {
      return this.title;
    },
  },
];

export const LIST_ITEMS: ListItems[] = [
  {
    field: "name",
    render: function (item) {
      return (
        <div className="flex gap-2">
          <img
            src={`https://www.google.com/s2/favicons?domain=${item.url}`}
            onLoad={(event: any) => event.target.classList?.toggle("invisible")}
            alt=""
            className="invisible w-5 h-5"
          />
          <span className="capitalize">{item[this.field]}</span>
        </div>
      );
    },
  },
  {
    field: "url",
    render: function (item) {
      return cutString(item[this.field]);
    },
  },
  {
    field: "date",
    render: function (item) {
      return item[this.field];
    },
  },
  {
    field: "duration",
    classes: "flex justify-end",
    render: function (item) {
      try {
        const { minutes, seconds } = timeDifference(
          item.events[0].timestamp,
          item.events[item.events.length - 1].timestamp
        );
        return `${minutes > 0 ? `${minutes}m` : ""} ${seconds}s `;
      } catch (error) {
        return "";
      }
    },
  },
  {
    field: "actions",
    classes: "flex justify-end",
    render: function (item, options) {
      const self = item;
      return (
        <div className="flex gap-5">
          <Dialog
            title="Confirm Deletion"
            visible={options.dialogName === "deleteSession"}
            onClose={() => {
              options.setActiveItem(null);
              options.setDialogName("");
            }}
            footer={
              <div className="flex justify-end gap-3">
                <OutlineButton
                  trackName="Delete Session - NO"
                  classes="min-w-[100px]"
                  onClick={() => {
                    options.setActiveItem(null);
                    options.setDialogName("");
                  }}
                >
                  No
                </OutlineButton>
                <OutlineButton
                  prefix={<TrashSVG />}
                  classes="min-w-[100px] hover:text-red-400 hover:border-red-400"
                  trackName="Delete Session - YES"
                  onClick={() => {
                    options.setDialogName("");
                    options.setActiveItem(null);
                    options.handleDelete(item);
                  }}
                >
                  Yes
                </OutlineButton>
              </div>
            }
          >
            <div className="my-10 text-2xl text-center text-slate-200 back">
              Are You Sure Want To Delete Recorded Sessions?
            </div>
          </Dialog>
          <Tooltip content="Play">
            <Link to={String(item.id)}>
              <div className="cursor-pointer hover:text-sky-500">
                <span className="w-[24px] inline-block">
                  <PlaySVG />
                </span>
              </div>
            </Link>
          </Tooltip>
          <Tooltip
            overlayInnerStyle={item?.docID ? { padding: 0 } : {}}
            content={
              item?.docID ? (
                <Input
                  readOnly
                  value={options.generateShareUrl(item.docID)}
                  suffix={
                    <span
                      onClick={() => options?.handleCopyToClipboard(item.docID)}
                      className="w-[24px] cursor-pointer hover:text-sky-500"
                    >
                      <Tooltip content="Copy">
                        <div className="cursor-pointer hover:text-sky-500">
                          <span className="w-[24px] inline-block">
                            <ClipboardSVG />
                          </span>
                        </div>
                      </Tooltip>
                    </span>
                  }
                />
              ) : (
                "Share"
              )
            }
          >
            <div className={`cursor-pointer ${item?.docID ? "text-sky-500" : "hover:text-sky-500"}`}>
              <span onClick={() => options?.handleShare(self)} className="w-[24px] inline-block">
                {item.id === options.sharingItemId ? <LoaderSVG /> : <ShareSVG />}
              </span>
            </div>
          </Tooltip>
          <Tooltip content="Delete Session">
            <div
              className="cursor-pointer hover:text-red-400"
              onClick={() => {
                options.setDialogName("deleteSession");
                options.setActiveItem(item);
              }}
            >
              <span className="w-[24px] inline-block">
                <TrashSVG />
              </span>
            </div>
          </Tooltip>
        </div>
      );
    },
  },
];
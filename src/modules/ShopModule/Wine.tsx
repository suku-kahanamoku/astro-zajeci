import { useState, useRef, useEffect } from "react";
import { t } from "../LangModule";
import { get, money, fileUrl } from "../CoreModule/objects";
import type { RecordData, Field } from "../CoreModule/types";
import Icon from "../UIModule/Icon";
import Modal from "../UIModule/Modal";
import { wineUrl, url } from "../../config/site";
import { addItem, useCart, cartSubtotal, shippingPrice } from "./cart";
import { useHydrated } from "../UIModule/useHydrated";
import listConfig from "../AdminModule/configs/wine-list.json";
import detailConfig from "../AdminModule/configs/wine-detail.json";
export function Price({
  value,
  old = false,
  locale = "cs",
}: {
  value: unknown;
  old?: boolean;
  locale?: string;
}) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      {old && (
        <span className="line-through text-gray-400 text-sm font-normal">
          {money(Number(value) * 1.1, locale)}
        </span>
      )}
      <span className="font-bold text-secondary-600 dark:text-secondary-400">
        {money(value, locale)}
      </span>
    </span>
  );
}
export function Attributes({
  wine,
  locale = "cs",
  fields = listConfig.fields,
}: {
  wine: RecordData;
  locale?: string;
  fields?: Field[];
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 py-2 text-sm text-gray-700 dark:text-gray-200">
      {fields.map((field) => {
        let value = get(wine, field.name);
        if (value === undefined || value === null || value === "") return null;
        if (["kind", "color"].includes(field.name))
          value = t("$.wine." + field.name + "." + value, locale);
        if (field.name === "data.volume") value += " l";
        if (field.name === "data.alcohol") value += " %";
        return (
          <div key={field.name} className="flex items-start gap-1.5">
            <Icon
              name={field.iconName}
              size={16}
              className="mt-0.5 text-gray-400"
            />
            <div className="min-w-0">
              <span className="text-xs text-gray-400 block leading-tight">
                {t(field.label, locale)}
              </span>
              <span className="font-medium leading-tight">{value}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
export function CartDialog({
  wine,
  quantity,
  locale,
  onClose,
}: {
  wine: RecordData;
  quantity: number;
  locale: string;
  onClose: () => void;
}) {
  const cart = useCart();
  const subtotal = cartSubtotal(cart.carts);
  const line = cart.carts.find(
    (item) => Number(item.product_id) === Number(wine.id),
  );
  const total =
    subtotal +
    shippingPrice(cart.shipping, subtotal) +
    shippingPrice(cart.payment, subtotal);
  return (
    <Modal
      title={t("$.cart.added", locale, { name: wine.name })}
      onClose={onClose}
      closeButton={false}
    >
      <div className="p-6 space-y-2">
        <p>
          {t("$.form.price", locale)}:{" "}
          <Price value={wine.price} locale={locale} />
        </p>
        <p>
          {t("$.form.quantity", locale)}: {line?.quantity || quantity}{" "}
          {t("$.pcs", locale)}
        </p>
        <p>
          {t("$.cart.total", locale)}: <Price value={total} locale={locale} />
        </p>
        <p className="alert !mt-5">{t("$.shipping.limit_free", locale)}</p>
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
        <button
          autoFocus
          className="btn outline !border-transparent"
          onClick={onClose}
          data-testid="dialog-no"
        >
          {t("$.btn.continue_shopping", locale)}
        </button>
        <a
          className="btn"
          href={url("/cashdesk", locale)}
          data-testid="dialog-yes"
        >
          {t("$.btn.to_order", locale)}
        </a>
      </div>
    </Modal>
  );
}
export function WineCard({
  wine,
  locale = "cs",
}: {
  wine: RecordData;
  locale?: string;
}) {
  const ready = useHydrated();
  const [added, setAdded] = useState(false);
  return (
    <article className="group relative flex flex-col h-full rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm hover:shadow-xl hover:border-secondary-400 transition-all duration-300">
      <div className="h-1 bg-linear-to-r from-secondary-400 to-secondary-600" />
      <a
        href={wineUrl(wine as any, locale)}
        className="relative block overflow-hidden bg-gray-100 dark:bg-transparent"
      >
        <img
          src={fileUrl(wine.files?.[0]?.path)}
          alt={wine.name}
          loading="lazy"
          width="400"
          height="288"
          className="mx-auto w-full h-60 md:h-72 object-contain transition-transform duration-500 group-hover:scale-105"
        />
        {wine.color && (
          <span className="absolute top-3 left-3 bg-white/90 dark:bg-gray-900/90 text-primary-600 dark:text-primary-300 text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
            {t("$.wine.color." + wine.color, locale)}
          </span>
        )}
      </a>
      <div className="flex flex-col flex-1 p-5 gap-3">
        <a href={wineUrl(wine as any, locale)}>
          <h3 className="font-serif text-lg font-bold text-primary-700 dark:text-white leading-snug hover:text-secondary-600">
            {wine.name}
          </h3>
          <Attributes wine={wine} locale={locale} />
        </a>
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-800 mt-auto">
          <Price value={wine.price} locale={locale} />
          <button
            disabled={!ready}
            className="btn small"
            onClick={() => {
              addItem(wine);
              setAdded(true);
            }}
          >
            <Icon name="heroicons:shopping-cart" size={16} />
            {t("$.wine.to_cart", locale)}
          </button>
        </div>
      </div>
      {added && (
        <CartDialog
          wine={wine}
          quantity={1}
          locale={locale}
          onClose={() => setAdded(false)}
        />
      )}
    </article>
  );
}
export function WineList({
  wines,
  locale = "cs",
  carousel = false,
}: {
  wines: RecordData[];
  locale?: string;
  carousel?: boolean;
}) {
  const ready = useHydrated();
  const ref = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ prev: false, next: false });
  useEffect(() => {
    const element = ref.current;
    if (!element || !carousel) return;
    const update = () =>
      setBounds({
        prev: element.scrollLeft > 1,
        next:
          element.scrollLeft + element.clientWidth < element.scrollWidth - 1,
      });
    update();
    element.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => {
      element.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [carousel, wines.length]);
  return (
    <div className={carousel ? "relative md:px-10 py-4" : ""}>
      {carousel && (
        <>
          <button
            disabled={!ready || !bounds.prev}
            className="carousel-prev icon-button"
            aria-label="Předchozí vína"
            onClick={() =>
              ref.current?.scrollBy({
                left: -ref.current.clientWidth,
                behavior: "smooth",
              })
            }
          >
            ←
          </button>
          <button
            disabled={!ready || !bounds.next}
            className="carousel-next icon-button"
            aria-label="Další vína"
            onClick={() =>
              ref.current?.scrollBy({
                left: ref.current.clientWidth,
                behavior: "smooth",
              })
            }
          >
            →
          </button>
        </>
      )}
      <div
        ref={ref}
        className={
          carousel
            ? "wine-carousel"
            : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        }
      >
        {wines.map((wine) => (
          <WineCard key={wine.id} wine={wine} locale={locale} />
        ))}
      </div>
    </div>
  );
}
export function WineDetail({
  wine,
  locale = "cs",
}: {
  wine: RecordData;
  locale?: string;
}) {
  const [active, setActive] = useState(0);
  const [quantity, setQty] = useState(1);
  const ready = useHydrated();
  const [added, setAdded] = useState(false);
  const images = wine.files?.length
    ? wine.files.map((file: any) => fileUrl(file.path))
    : ["/img/bottle.jpg"];
  return (
    <div className="w-full flex flex-col max-w-7xl mx-auto px-4 md:px-8 py-10 gap-16">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
        <div className="relative">
          <div className="rounded-3xl overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <img
              src={images[active]}
              alt={wine.name}
              width="640"
              height="480"
              className="w-full h-60 sm:h-90 md:h-120 object-contain p-7"
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 justify-center pt-3 flex-wrap">
              {images.map((src: string, index: number) => (
                <button
                  disabled={!ready}
                  key={src}
                  onClick={() => setActive(index)}
                  aria-label={`${wine.name} ${index + 1}`}
                  aria-pressed={active === index}
                  className={
                    "size-16 md:size-24 rounded-lg overflow-hidden border-2 " +
                    (active === index
                      ? "border-primary-500"
                      : "border-transparent opacity-40 hover:opacity-100")
                  }
                >
                  <img
                    src={src}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
          {wine.color && (
            <span className="absolute top-4 left-4 rounded-full bg-white dark:bg-gray-900 text-primary-600 px-3 py-1.5 text-xs shadow">
              {t("$.wine.color." + wine.color, locale)}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-6">
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-primary-800 dark:text-white leading-tight">
            {wine.name}
          </h1>
          <div className="section-divider text-secondary-400 !mx-0">
            <Icon name="ph:wine-duotone" />
          </div>
          {wine.description && (
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {wine.description}
            </p>
          )}
          <div className="rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 p-5">
            <Attributes
              wine={wine}
              fields={detailConfig.fields}
              locale={locale}
            />
          </div>
          <hr className="border-gray-200 dark:border-gray-700" />
          <div className="flex items-end justify-between gap-4">
            <div className="text-3xl">
              <Price value={wine.price} locale={locale} />
            </div>
            <div className="quantity">
              <button
                disabled={!ready}
                aria-label="Snížit množství"
                onClick={() => setQty(Math.max(1, quantity - 1))}
              >
                −
              </button>
              <input
                type="number"
                aria-label={t("$.form.quantity", locale)}
                min="1"
                value={quantity}
                onChange={(event) =>
                  setQty(Math.max(1, Number(event.target.value) || 1))
                }
              />
              <button
                disabled={!ready}
                aria-label="Zvýšit množství"
                onClick={() => setQty(quantity + 1)}
              >
                +
              </button>
            </div>
          </div>
          <button
            disabled={!ready}
            className="btn large w-full text-lg"
            onClick={() => {
              addItem(wine, quantity);
              setAdded(true);
            }}
          >
            <Icon name="heroicons:shopping-cart" />
            {t("$.wine.to_cart", locale)}
          </button>
        </div>
      </div>
      <a className="inline-flex items-center gap-2" href={url("/wine", locale)}>
        ← {t("$.wine.title", locale)}
      </a>
      {added && (
        <CartDialog
          wine={wine}
          quantity={quantity}
          locale={locale}
          onClose={() => setAdded(false)}
        />
      )}
    </div>
  );
}

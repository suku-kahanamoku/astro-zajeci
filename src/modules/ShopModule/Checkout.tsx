import { useEffect, useRef, useState } from "react";
import {
  useCart,
  updateCart,
  setQuantity,
  cartSubtotal,
  shippingPrice,
  resetCart,
} from "./cart";
import { Price, Attributes } from "./Wine";
import { Fields } from "../UIModule/Form";
import Modal from "../UIModule/Modal";
import { api } from "../CoreModule/api";
import { money, fileUrl } from "../CoreModule/objects";
import { t } from "../LangModule";
import { url, wineUrl } from "../../config/site";
import type { RecordData } from "../CoreModule/types";
import billingConfig from "../AdminModule/configs/billing.json";
import shippingConfig from "../AdminModule/configs/shipping.json";
export default function Checkout({
  locale = "cs",
  user = null,
}: {
  locale?: string;
  user?: RecordData | null;
}) {
  const cart = useCart();
  const [step, setStep] = useState(0);
  const [shipping, setShipping] = useState<RecordData[]>([]);
  const [payments, setPayments] = useState<RecordData[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [remove, setRemove] = useState<RecordData | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const sending = useRef(false);
  useEffect(() => {
    let active = true;
    Promise.all([
      api(
        "/api/enumerations?" +
          new URLSearchParams({
            q: JSON.stringify({ type: { $eq: "shipping" } }),
            limit: "100",
            sort: '[{"position":1}]',
          }),
      ),
      api(
        "/api/enumerations?" +
          new URLSearchParams({
            q: JSON.stringify({ type: { $eq: "payment" } }),
            limit: "100",
            sort: '[{"position":1}]',
          }),
      ),
    ])
      .then(([s, p]) => {
        if (active) {
          setShipping(s.data.filter((item: any) => Number(item.published)));
          setPayments(p.data.filter((item: any) => Number(item.published)));
        }
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (user && !cart.user.email)
      updateCart({
        user: {
          ...cart.user,
          ...user,
          address: user.address || cart.user.address,
        },
      });
  }, [user, cart.user.email]);
  const subtotal = cartSubtotal(cart.carts);
  const selectedShipping =
    shipping.find(
      (item) =>
        (item.value ?? item.syscode) ===
        (cart.shipping.value ?? cart.shipping.syscode),
    ) || shipping.find((item) => !item.data?.disabled);
  const selectedPayment =
    payments.find(
      (item) =>
        (item.value ?? item.syscode) ===
        (cart.payment.value ?? cart.payment.syscode),
    ) || payments.find((item) => !item.data?.disabled);
  const shippingCost = shippingPrice(selectedShipping || {}, subtotal);
  const paymentCost = shippingPrice(selectedPayment || {}, subtotal);
  const total = subtotal + shippingCost + paymentCost;
  const shippingValue = selectedShipping?.value ?? selectedShipping?.syscode;
  const titles = [
    t("$.cart.title", locale),
    t("$.cashdesk.shipping_payment", locale),
    t("$.cashdesk.summary", locale),
  ];
  function next() {
    setError("");
    if (!cart.carts.length) return;
    if (
      step === 1 &&
      (!form.current?.reportValidity() || !selectedShipping || !selectedPayment)
    ) {
      setError(
        locale === "en"
          ? "Complete your billing, shipping and payment details."
          : "Vyplňte fakturační údaje, dopravu a platbu.",
      );
      return;
    }
    const nextStep = step + 1;
    setStep(nextStep);
    history.replaceState(
      null,
      "",
      "?" + new URLSearchParams({ step: titles[nextStep] }),
    );
    document.getElementById("cashdesk")?.scrollIntoView({ behavior: "smooth" });
  }
  async function submit() {
    if (sending.current) return;
    sending.current = true;
    setBusy(true);
    setError("");
    try {
      const email = cart.user.email;
      const body = {
        user: cart.user,
        carts: cart.carts.map((line) => ({
          product_id: line.product_id,
          quantity: line.quantity,
          unit_price: line.unit_price,
          total_price: line.total_price,
        })),
        shipping: {
          ...selectedShipping,
          value: shippingValue,
          label: selectedShipping?.label,
          price: shippingCost,
        },
        billing: {
          ...selectedPayment,
          value: selectedPayment?.value ?? selectedPayment?.syscode,
        },
        total_price: total,
      };
      const result = await api("/api/order", "POST", body);
      if (!result.data?.id) throw new Error("Objednávka nebyla potvrzena.");
      try {
        sessionStorage.setItem(
          "zajeci-last-order",
          JSON.stringify({
            id: result.data.id,
            email,
            number: result.data.order_number,
            message: result.message,
          }),
        );
      } catch {}
      resetCart();
      location.href =
        url("/cashdesk-completed", locale) +
        "?" +
        new URLSearchParams({ orderId: String(result.data.id), email });
    } catch (err) {
      setError((err as Error).message);
      sending.current = false;
      setBusy(false);
    }
  }
  const address = (data: any) =>
    [
      data?.name,
      data?.street,
      [data?.zip, data?.city].filter(Boolean).join(" "),
      data?.state || data?.country,
    ]
      .filter(Boolean)
      .join(", ");
  return (
    <section id="cashdesk" className="max-w-7xl mx-auto px-5 pb-12">
      <h1 className="page-title">{t("$.cashdesk.title", locale)}</h1>
      <ol className="checkout-steps">
        {titles.map((title, index) => (
          <li key={title} aria-current={step === index ? "step" : undefined}>
            <span>{index + 1}</span>
            {title}
          </li>
        ))}
      </ol>
      {!cart.carts.length ? (
        <div className="panel text-center space-y-4">
          <p>{t("$.cart.empty", locale)}</p>
          <a className="btn" href={url("/wine", locale)}>
            {t("$.btn.back_shopping", locale)}
          </a>
        </div>
      ) : (
        <>
          {step === 0 && (
            <>
              <div className="space-y-6">
                {cart.carts.map((line) => (
                  <article
                    key={line.product_id}
                    className="panel grid md:grid-cols-2 gap-8"
                  >
                    <div className="flex items-center gap-4">
                      <a href={wineUrl(line.wine as any, locale)}>
                        <img
                          src={fileUrl(line.wine.files?.[0]?.path)}
                          alt={line.wine.name}
                          width="110"
                          height="150"
                          className="w-24 h-36 object-contain"
                        />
                      </a>
                      <div>
                        <a
                          className="font-serif text-xl font-bold text-primary-700 dark:text-white"
                          href={wineUrl(line.wine as any, locale)}
                        >
                          {line.wine.name}
                        </a>
                        <Attributes wine={line.wine} locale={locale} />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="quantity">
                          <button
                            aria-label="Snížit množství"
                            onClick={() =>
                              line.quantity === 1
                                ? setRemove(line)
                                : setQuantity(
                                    line.product_id,
                                    line.quantity - 1,
                                  )
                            }
                          >
                            −
                          </button>
                          <input
                            type="number"
                            aria-label={t("$.form.quantity", locale)}
                            min="1"
                            value={line.quantity}
                            onChange={(event) =>
                              setQuantity(
                                line.product_id,
                                Math.max(1, Number(event.target.value)),
                              )
                            }
                          />
                          <button
                            aria-label="Zvýšit množství"
                            onClick={() =>
                              setQuantity(line.product_id, line.quantity + 1)
                            }
                          >
                            +
                          </button>
                        </div>
                        <button
                          className="btn outline secondary"
                          onClick={() => setRemove(line)}
                          aria-label={t("$.btn.delete", locale)}
                        >
                          ×
                        </button>
                      </div>
                      <p className="flex justify-between">
                        {t("$.form.vat", locale)}{" "}
                        <span>{line.wine.vat_rate ?? "—"} %</span>
                      </p>
                      <p className="flex justify-between">
                        {t("$.form.price_without_vat", locale)}{" "}
                        <Price
                          value={line.total_price}
                          old={false}
                          locale={locale}
                        />
                      </p>
                      <p className="flex justify-between font-semibold">
                        {t("$.form.price_with_vat", locale)}{" "}
                        <Price
                          value={line.total_price_with_vat}
                          old={false}
                          locale={locale}
                        />
                      </p>
                    </div>
                  </article>
                ))}
              </div>
              <p className="alert my-4">{t("$.shipping.limit_free", locale)}</p>
            </>
          )}
          {step === 1 && (
            <form
              ref={form}
              onSubmit={(event) => {
                event.preventDefault();
                next();
              }}
              className="space-y-8"
            >
              <section className="panel space-y-5">
                <h2 className="text-2xl font-bold">
                  {t("$.cashdesk.billing_address", locale)}
                </h2>
                <Fields
                  fields={billingConfig.fields}
                  value={cart.user}
                  onChange={(value) => updateCart({ user: value })}
                  locale={locale}
                />
              </section>
              <div className="grid lg:grid-cols-2 gap-8">
                <section className="panel space-y-5">
                  <h2 className="text-2xl font-bold">
                    {t("$.shipping.title", locale)}
                  </h2>
                  {shipping.map((item) => (
                    <label
                      key={item.id}
                      className="flex gap-3 items-center py-2"
                    >
                      <input
                        type="radio"
                        name="shipping"
                        value={item.value ?? item.syscode}
                        checked={item === selectedShipping}
                        disabled={!!item.data?.disabled}
                        required
                        onChange={() => updateCart({ shipping: item })}
                      />
                      {item.data?.icon?.startsWith("/") && (
                        <img src={item.data.icon} width="60" alt="" />
                      )}
                      <span className="flex-1">{t(item.label, locale)}</span>
                      <span>
                        {shippingPrice(item, subtotal)
                          ? money(shippingPrice(item, subtotal), locale)
                          : t("$.btn.free", locale)}
                      </span>
                    </label>
                  ))}
                  {shippingValue !== "free" && (
                    <Fields
                      fields={shippingConfig.fields}
                      value={cart.user.address?.shipping || {}}
                      onChange={(value) =>
                        updateCart({
                          user: {
                            ...cart.user,
                            address: { ...cart.user.address, shipping: value },
                          },
                        })
                      }
                      locale={locale}
                    />
                  )}
                </section>
                <section className="panel space-y-5">
                  <h2 className="text-2xl font-bold">
                    {t("$.payment.title", locale)}
                  </h2>
                  {payments.map((item) => (
                    <label
                      key={item.id}
                      className="flex gap-3 items-center py-2"
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={item === selectedPayment}
                        disabled={!!item.data?.disabled}
                        required
                        onChange={() => updateCart({ payment: item })}
                      />
                      <span className="flex-1">{t(item.label, locale)}</span>
                      <span>
                        {shippingPrice(item, subtotal)
                          ? money(shippingPrice(item, subtotal), locale)
                          : t("$.btn.free", locale)}
                      </span>
                    </label>
                  ))}
                </section>
              </div>
            </form>
          )}
          {step === 2 && (
            <>
              <div className="panel table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      {[
                        "$.form.name",
                        "$.form.quantity",
                        "$.form.price_without_vat",
                        "$.form.vat",
                        "$.form.price_with_vat",
                      ].map((key) => (
                        <th key={key}>{t(key, locale)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cart.carts.map((line) => (
                      <tr key={line.product_id}>
                        <td>{line.wine.name}</td>
                        <td>{line.quantity}</td>
                        <td>{money(line.total_price, locale)}</td>
                        <td>{line.wine.vat_rate ?? "—"} %</td>
                        <td>{money(line.total_price_with_vat, locale)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={4}>{t("$.shipping.title", locale)}</td>
                      <td>{money(shippingCost, locale)}</td>
                    </tr>
                    <tr>
                      <td colSpan={4}>{t("$.payment.title", locale)}</td>
                      <td>{money(paymentCost, locale)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="grid md:grid-cols-3 gap-4 my-8">
                <section className="panel">
                  <h2 className="font-bold text-xl mb-4">
                    {t("$.cashdesk.billing_address", locale)}
                  </h2>
                  <p>{cart.user.email}</p>
                  <p>
                    {cart.user.first_name} {cart.user.last_name}
                  </p>
                  <p>{cart.user.phone}</p>
                  <p>{address(cart.user.address?.main)}</p>
                </section>
                <section className="panel">
                  <h2 className="font-bold text-xl mb-4">
                    {t("$.shipping.title", locale)}
                  </h2>
                  <p>{selectedShipping?.label}</p>
                  <p>{address(cart.user.address?.shipping)}</p>
                  {shippingValue === "free" && (
                    <p className="alert mt-3">
                      {t("$.shipping.brno_free", locale)}
                    </p>
                  )}
                </section>
                <section className="panel">
                  <h2 className="font-bold text-xl mb-4">
                    {t("$.payment.title", locale)}
                  </h2>
                  <p>{selectedPayment?.label}</p>
                  {selectedPayment?.value === "bank" && (
                    <>
                      <p>
                        {t("$.payment.account_num", locale)}:{" "}
                        {selectedPayment.data?.account}
                      </p>
                      <p>IBAN: {selectedPayment.data?.iban}</p>
                      <p>SWIFT/BIC: {selectedPayment.data?.swift}</p>
                    </>
                  )}
                </section>
              </div>
            </>
          )}
          <p className="text-xl font-bold text-right my-6">
            {t("$.order.total_price", locale)}:{" "}
            <Price value={total} old={false} locale={locale} />
          </p>
          {error && (
            <p className="alert error my-4" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-between gap-4">
            {step === 0 ? (
              <a href={url("/wine", locale)} className="btn outline secondary">
                ← {t("$.btn.back_shopping", locale)}
              </a>
            ) : (
              <button
                className="btn outline"
                disabled={busy}
                onClick={() => setStep(step - 1)}
              >
                ← {titles[step - 1]}
              </button>
            )}
            <button
              className={"btn " + (step === 2 ? "secondary" : "")}
              disabled={busy}
              onClick={step < 2 ? next : submit}
            >
              {busy
                ? "…"
                : step === 2
                  ? t("$.btn.complete_order", locale)
                  : titles[step + 1]}{" "}
              →
            </button>
          </div>
        </>
      )}
      {remove && (
        <Modal
          title={t("$.cart.remove_from_cart", locale)}
          onClose={() => setRemove(null)}
        >
          <div className="p-6 space-y-6">
            <p>{t("$.cart.remove", locale, { name: remove.wine.name })}</p>
            <div className="flex gap-3">
              <button
                className="btn secondary"
                onClick={() => {
                  setQuantity(remove.product_id, 0);
                  setRemove(null);
                }}
              >
                {t("$.btn.delete", locale)}
              </button>
              <button className="btn outline" onClick={() => setRemove(null)}>
                {t("$.btn.cancel", locale)}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}

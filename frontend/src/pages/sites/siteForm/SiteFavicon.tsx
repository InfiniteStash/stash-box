import cx from "classnames";
import { type ChangeEvent, type FC, useState } from "react";
import { Button } from "src/components/ui/button";
import { FormGroup } from "src/components/ui/field";
import { Input } from "src/components/ui/input";
import { useLazyFetchSiteFavicons } from "src/graphql";

const parseMimeType = (dataURL: string) =>
  dataURL.match(/^data:([^;,]+)/)?.[1] ?? "unknown";

interface SiteFaviconProps {
  /** The stored icon URL, shown as the preview while the favicon is unchanged. */
  currentIcon?: string;
  /** Returns the site URL to discover favicons from. */
  getUrl: () => string;
  /** null: unchanged, "": cleared, otherwise a base64 data URL to store. */
  value: string | null;
  onChange: (value: string) => void;
}

const SiteFavicon: FC<SiteFaviconProps> = ({
  currentIcon,
  getUrl,
  value,
  onChange,
}) => {
  const [candidates, setCandidates] = useState<
    { url: string; image: string }[]
  >([]);
  const [error, setError] = useState<string>();
  // Pixel dimensions per candidate, read from each image once it loads.
  const [dimensions, setDimensions] = useState<Record<string, string>>({});
  const [fetchFavicons, { loading }] = useLazyFetchSiteFavicons();

  const preview = value === null ? (currentIcon ?? "") : value;

  const handleFetch = () => {
    setError(undefined);
    setCandidates([]);
    setDimensions({});
    fetchFavicons({ variables: { url: getUrl() } })
      .then((res) => {
        if (res.error) {
          setError(res.error.message);
          return;
        }
        const found = res.data?.fetchSiteFavicons ?? [];
        if (found.length === 0) setError("No favicons found");
        setCandidates(found.map(({ url, image }) => ({ url, image })));
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Failed to fetch");
      });
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.validity.valid && event.target.files?.[0]) {
      const reader = new FileReader();
      reader.onload = (e) =>
        e.target?.result && onChange(e.target.result as string);
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  return (
    <FormGroup className="mb-3">
      <span className="text-sm font-medium">Favicon</span>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {preview ? (
          <img src={preview} alt="" width={24} height={24} />
        ) : (
          <span className="text-muted-foreground">No favicon</span>
        )}
        <Button
          type="button"
          size="sm"
          onClick={handleFetch}
          disabled={loading}
        >
          {loading ? "Fetching…" : "Fetch favicons"}
        </Button>
        {preview && (
          <Button
            type="button"
            size="sm"
            variant="danger"
            onClick={() => {
              onChange("");
              setCandidates([]);
            }}
          >
            Remove
          </Button>
        )}
        <Input
          type="file"
          aria-label="Upload favicon"
          className="w-auto max-w-full ml-auto"
          onChange={onFileChange}
          accept=".ico,.png,.jpg,.jpeg,.webp,.svg,.gif"
        />
      </div>

      {error && <div className="text-destructive text-sm mb-2">{error}</div>}

      {candidates.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {candidates.map((candidate) => (
            <button
              type="button"
              key={candidate.url}
              className={cx(
                "flex flex-col items-center rounded-md border border-border bg-secondary p-2 hover:bg-accent",
                { "ring-2 ring-ring": value === candidate.image },
              )}
              title={candidate.url}
              onClick={() => onChange(candidate.image)}
            >
              <img
                src={candidate.image}
                alt=""
                width={32}
                height={32}
                onLoad={(e) => {
                  const { naturalWidth, naturalHeight } = e.currentTarget;
                  setDimensions((d) => ({
                    ...d,
                    [candidate.url]: `${naturalWidth}×${naturalHeight}`,
                  }));
                }}
              />
              <span className="text-sm text-muted-foreground mt-1">
                {parseMimeType(candidate.image)}
                {dimensions[candidate.url]
                  ? ` · ${dimensions[candidate.url]}`
                  : ""}
              </span>
            </button>
          ))}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Fetch favicons from the site URL, or upload a custom icon.
      </p>
    </FormGroup>
  );
};

export default SiteFavicon;

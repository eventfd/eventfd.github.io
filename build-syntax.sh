#!/bin/bash

if [ -z "$1" -o -z "$2" ]; then
    echo "Usage: $0 <light> <dark>"
    exit 1
fi

LIGHT_CSS=$(hugo gen chromastyles --style="$1" | sed 's,^,  ,g')
DARK_CSS=$(hugo gen chromastyles --style="$2" | sed 's,^,  ,g')

cat <<EOF > assets/css/syntax-highlighting.css
@media (prefers-color-scheme: light) {
${LIGHT_CSS}

/* inline code */
`echo "${LIGHT_CSS}" | sed 's, .chroma , .code-inline ,g'`
}

@media (prefers-color-scheme: dark) {
${DARK_CSS}

/* inline code */
`echo "${DARK_CSS}" | sed 's, .chroma , .code-inline ,g'`
}

.light {
${LIGHT_CSS}
/* inline code */
`echo "${LIGHT_CSS}" | sed 's, .chroma , .code-inline ,g'`
}

.dark {
${DARK_CSS}

/* inline code */
`echo "${DARK_CSS}" | sed 's, .chroma , .code-inline ,g'`
}
EOF

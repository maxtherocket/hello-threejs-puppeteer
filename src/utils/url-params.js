let urlParamsTemp = {
  get : () => {}
};
if (typeof window !== 'undefined') {
  urlParamsTemp = new URLSearchParams(window.location.search);
}

const urlParams = urlParamsTemp;

export default urlParams;

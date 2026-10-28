# v44 — App/How title transition

Reported: nativeHowkicker/heading crossed the bottom of the phone; heading then jumped to fixedposition and faded into a darkghost. Rootcause: positionclass toggled only6.35<virtualt<8, while documentflow followedactualscroll. Latepaircaption also outlived app-stage stickylimit6H.

## Change
One .connection-title-stage insideHowintro owns the heading throughout animatedmode. Itsmanagedposition staysfixed; nativekicker ishidden. Sharedactualviewportclip occludesitbeforeadjacentcontent. Heading uses source-style line masks atfullinkopacity, notwholeheadingfade. Reveal=min(actualphase,scenephase) prevents earlydisplay andlagleaks. Outgoingpaircaption staysfixed initsviewportlane andusesbothactual/scenephaseguard. Resize resplits/reappliesmasks; reduced/failuremode/dispose restoreordinarynativeheading/kicker.

No phone/collar geometry/material/light, v43reflection/shadowpipeline, artwork orpose changes.

## Checks
- ProductionAstro4routes, targetedTS anddiffcheck pass. ExistingThreechunkwarning unchanged.
- App tests:9Ktitlephase samples continuous/bounded, forward/reverse and±1Hlagguards; fixedcaptionactualboundaryguard; allpriorphase/C1/vector/physicalstatechecks. Buildretainsonehow-title idandone managedstage/nativeheading.
- Nineblock/7film/assetpath landing checks pass.
- NativeIAB1020×1194: at6.208Hnexttitlelayerhidden/kickernone, outgoingcaptiontop167px ratherthannavoverlap. At6.508Hheadingrevealsinupperlane withopacity1 andno nativebottomcopy. Exit7.723Hclipmatchedflowtop331.125px. FastPageDown7.925Hbothlatecaption/titlehidden, PageUprestoresfixedfullinkheading. No horizontaloverflow, errors/warnings.
- Native390×844: carrytitlefits; at6.211Hnextlayerhidden/kickernone, outgoingcaptiontop135px staysunderheader; no overflow. Viewportreset.
- Proof: projectroot tmp/app-handoff-v44/qa/{before-title,title-reveal,title-exit,fast-reverse,mobile-title,mobile-before-title,final}.png. Preview4321/?v=44#how.

Native/reducedfallbackrestoration verified bysource/markup; OSreducedvisualmode/physicalFPS notbenchmarked. Uservisualreviewpending. Baselinev4353fc6afretained; localonly/no publish.
